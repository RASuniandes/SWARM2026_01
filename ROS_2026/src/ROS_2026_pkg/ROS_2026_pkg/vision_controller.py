#!/usr/bin/env python3
import rclpy
from rclpy.lifecycle import LifecycleNode, State, TransitionCallbackReturn
from geometry_msgs.msg import Twist
from std_msgs.msg import String
import cv2
import mediapipe as mp
from time import time

class HandController(LifecycleNode):
    def __init__(self):
        super().__init__('hand_controller')
        self.publisher_ = None
        self.router_listener = None
        self.timer_ = None
        self.twist = Twist()

        # Camera and MediaPipe placeholders
        self.cap = None
        self.mp_pose = None
        self.pose = None

        # Configuration Parameter Placeholders
        self.display_feed = False
        self.max_linear_vel = 1.0
        self.max_angular_vel = 1.0
        self.linear_deadzone = 0.05
        self.angular_deadzone = 0.10
        self.sensitivity = 1.0

        # Analytics variables
        self.prev_time = time()
        self.frame_count = 0
        self.fps = 0.0
        self.angular_speed = 0.0
        self.linear_speed = 0.0

        self.get_logger().info("📷 Hand Controller initialized. Awaiting Lifecycle transition...")

    def on_configure(self, state: State) -> TransitionCallbackReturn:
        self.get_logger().info('Configuring Vision components and tracking parameters...')
        
        # 1. Declare and load parameters
        self.declare_parameter('display_feed', True)
        self.declare_parameter('max_linear_vel', 1.0)
        self.declare_parameter('max_angular_vel', 1.5)
        self.declare_parameter('linear_deadzone', 0.02)
        self.declare_parameter('angular_deadzone', 0.10)
        self.declare_parameter('sensitivity', 10.0) # Scaling multiplier factor for error values

        self.display_feed = self.get_parameter('display_feed').value
        self.max_linear_vel = self.get_parameter('max_linear_vel').value
        self.max_angular_vel = self.get_parameter('max_angular_vel').value
        self.linear_deadzone = self.get_parameter('linear_deadzone').value
        self.angular_deadzone = self.get_parameter('angular_deadzone').value
        self.sensitivity = self.get_parameter('sensitivity').value

        # 2. Setup lifecycle communication endpoints
        self.publisher_ = self.create_lifecycle_publisher(Twist, 'cmd_hand', 10)
        self.router_listener = self.create_subscription(String, 'router_listener', self.router_callback, 10)
        
        # 3. Hardware Allocation: Open Camera
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            self.get_logger().error("Hardware Error: Could not access video capture interface (device 0).")
            return TransitionCallbackReturn.FAILURE

        # 4. Model Allocation: Initialize MediaPipe Instance
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

        self.get_logger().info("📷 Hand Controller configured successfully.")
        return TransitionCallbackReturn.SUCCESS

    def on_activate(self, state: State) -> TransitionCallbackReturn:
        self.get_logger().info('Activating Vision Loop. Tracking enabled.')
        self.publisher_.on_activate()
        
        # Start processing tracking loops at 10Hz cleanly within the executor frame
        self.timer_ = self.create_timer(0.1, self.process_frame)
        return TransitionCallbackReturn.SUCCESS

    def on_deactivate(self, state: State) -> TransitionCallbackReturn:
        self.get_logger().info('Deactivating Vision Loop...')
        
        if self.timer_:
            self.timer_.cancel()
            self.destroy_timer(self.timer_)
            self.timer_ = None
            
        self.stop_robot()
        self.publisher_.on_deactivate()
        
        # Close tracking window if display was active
        if self.display_feed:
            cv2.destroyAllWindows()
            
        return TransitionCallbackReturn.SUCCESS

    def on_cleanup(self, state: State) -> TransitionCallbackReturn:
        self.get_logger().info('Tearing down active vision and capture memory allocations...')
        self.free_resources()
        
        if self.publisher_:
            self.destroy_publisher(self.publisher_)
        if self.router_listener:
            self.destroy_subscription(self.router_listener)
        return TransitionCallbackReturn.SUCCESS

    def on_shutdown(self, state: State) -> TransitionCallbackReturn:
        self.get_logger().info('Shutting down Vision Controller node context...')
        self.free_resources()
        return TransitionCallbackReturn.SUCCESS

    def free_resources(self):
        try:
            if self.pose:
                self.pose.close()
                self.pose = None
            if self.cap and self.cap.isOpened():
                self.cap.release()
                self.cap = None
            cv2.destroyAllWindows()
            self.get_logger().info("Memory and peripheral capture components released safely.")
        except Exception as e:
            self.get_logger().warn(f"Exception raised during tracking resource cleanup: {e}")

    def process_frame(self):
        if self.cap is None or not self.cap.isOpened():
            return

        ret, frame = self.cap.read()
        if not ret or frame is None:
            self.get_logger().error("Hardware read failure on active video buffer device stream.")
            return

        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)

        twist = Twist()
        status_text = "No Person"

        if results.pose_landmarks:
            height, width, _ = frame.shape
            middle_x = width // 2

            ls = results.pose_landmarks.landmark[11]
            rs = results.pose_landmarks.landmark[12]
            lh = results.pose_landmarks.landmark[23]
            rh = results.pose_landmarks.landmark[24]

            use_shoulders = ls.visibility > 0.5 and rs.visibility > 0.5
            use_hips = lh.visibility > 0.5 and rh.visibility > 0.5

            if use_shoulders or use_hips:
                if use_shoulders:
                    lx, ly = ls.x, ls.y
                    rx, ry = rs.x, rs.y
                    status_text = "Using Shoulders"
                else:
                    lx, ly = lh.x, lh.y
                    rx, ry = rh.x, rh.y
                    status_text = "Using Hips"

                cx = int((lx + rx) / 2 * width)
                width_ratio = abs(rx - lx)

                # --- 1. Angular Speed Deadzone and Parameter Sensitivity Mapping ---
                raw_angular_error = (middle_x - cx) / middle_x
                
                if abs(raw_angular_error) < self.angular_deadzone:
                    self.angular_speed = 0.0
                else:
                    # Apply proportional scaling sensitivity parameter
                    self.angular_speed = raw_angular_error * self.sensitivity
                
                # Cap output velocities to parameter constraints
                self.angular_speed = max(-self.max_angular_vel, min(self.max_angular_vel, self.angular_speed))

                # --- 2. Linear Speed Deadzone and Depth Proxy Mapping ---
                SAFE_DISTANCE_RATIO = 0.1
                DANGER_DISTANCE_RATIO = 0.2

                if width_ratio > DANGER_DISTANCE_RATIO:
                    raw_linear_error = -(width_ratio - DANGER_DISTANCE_RATIO)
                    status_text += " - Too Close"
                elif width_ratio > SAFE_DISTANCE_RATIO:
                    raw_linear_error = 0.0
                    status_text += " - Stop"
                else:
                    raw_linear_error = (SAFE_DISTANCE_RATIO - width_ratio)
                    status_text += " - Following"

                # Apply proportional linear sensitivity filter and deadzone verification
                if abs(raw_linear_error) < self.linear_deadzone:
                    self.linear_speed = 0.0
                else:
                    self.linear_speed = raw_linear_error * self.sensitivity
                
                self.linear_speed = max(-self.max_linear_vel, min(self.max_linear_vel, self.linear_speed))

                # Pack target command message
                twist.linear.x = self.linear_speed
                twist.angular.z = -self.angular_speed

                # Draw overlay if UI display feed configuration parameter is enabled
                if self.display_feed:
                    cv2.circle(frame, (cx, int((ly + ry) / 2 * height)), 10, (0, 255, 0), -1)
                    cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

                if self.publisher_ and self.publisher_.is_activated():
                    self.publisher_.publish(twist)
                    self.get_logger().info(f"{status_text} | Linear: {twist.linear.x:.2f}, Angular: {twist.angular.z:.2f}")
        else:
            self.stop_robot()
            if self.display_feed:
                cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        # --- 3. Conditional Window GUI Loop Render ---
        if self.display_feed:
            cv2.imshow("Hand Controller Feed", frame)
            # waitKey(1) handles raw internal UI events required by OpenCV to redraw frames cleanly
            cv2.waitKey(1)

        self.frame_count += 1
        elapsed = time() - self.prev_time
        if elapsed >= 1.0:
            self.fps = self.frame_count / elapsed
            self.frame_count = 0
            self.prev_time = time()
            self.get_logger().info(f"Vision Metrics -> FPS: {self.fps:.2f}")

    def stop_robot(self):
        self.twist.linear.x = 0.0
        self.twist.angular.z = 0.0
        if self.publisher_ and self.publisher_.is_activated():
            self.publisher_.publish(self.twist)

    def router_callback(self, msg):
        self.get_logger().info(f"Router heartbeat payload mode confirmation: {msg.data}")

def main(args=None):
    rclpy.init(args=args)
    lifecycle_node = HandController()
    try:
        rclpy.spin(lifecycle_node)
    except KeyboardInterrupt:
        pass
    finally:
        lifecycle_node.free_resources()
        lifecycle_node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()