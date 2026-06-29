#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
import mediapipe as mp
import cv2
from time import time


class HumanFollower(Node):
    def __init__(self):
        super().__init__('human_follower')
        self.publisher_ = self.create_publisher(Twist, 'vision_command', 10)

        # Video capture (USB or CSI camera)
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            self.get_logger().error("Could not open camera.")
            return

        # Mediapipe setup
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

        # Variables
        self.prev_time = time()
        self.frame_count = 0
        self.fps = 0.0
        self.angular_speed = 0.0
        self.linear_speed = 0.0

        # Timer (10 Hz)
        self.timer = self.create_timer(0.1, self.process_frame)

    def process_frame(self):
        ret, frame = self.cap.read()
        if not ret or frame is None:
            self.get_logger().error("Camera read error")
            return

        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)

        twist = Twist()
        status_text = "No Person"

        if results.pose_landmarks:
            height, width, _ = frame.shape
            middle_x = width // 2

            # Shoulders or hips
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

                # Angular speed (horizontal deviation)
                self.angular_speed = (middle_x - cx) / middle_x
                if -0.1 < self.angular_speed < 0.1:
                    self.angular_speed = 0.0
                self.angular_speed = max(-1.0, min(1.0, self.angular_speed))

                # Linear speed (depth proxy)
                SAFE_DISTANCE_RATIO = 0.1
                DANGER_DISTANCE_RATIO = 0.2

                if width_ratio > DANGER_DISTANCE_RATIO:
                    self.linear_speed = -min(1.0, (width_ratio - DANGER_DISTANCE_RATIO) * 10)
                    status_text += " - Too Close"
                elif width_ratio > SAFE_DISTANCE_RATIO:
                    self.linear_speed = 0.0
                    status_text += " - Stop"
                else:
                    self.linear_speed = min(1.0, (SAFE_DISTANCE_RATIO - width_ratio) * 10)
                    status_text += " - Following"

                # Scale to robot speed range
                twist.linear.x = self.linear_speed * 100
                twist.angular.z = - self.angular_speed * 100

                # Publish
                self.publisher_.publish(twist)

                # 💬 Print to console
                self.get_logger().info(
                    f"{status_text} | Linear: {twist.linear.x:.2f}, Angular: {twist.angular.z:.2f}"
                )
        else:
            self.get_logger().info(
                    f"Linear: 0, Angular: 0"
            )
            twist.linear.x = 0.0
            twist.angular.z = 0.0
            self.publisher_.publish(twist)
        # FPS counter (optional)
        self.frame_count += 1
        elapsed = time() - self.prev_time
        if elapsed >= 1.0:
            self.fps = self.frame_count / elapsed
            self.frame_count = 0
            self.prev_time = time()
            self.get_logger().info(f"FPS: {self.fps:.2f}")

    def destroy_node(self):
        try:
            self.pose.close()
            self.cap.release()
            cv2.destroyAllWindows()
        except Exception:
            pass
        super().destroy_node()


def main(args=None):
    rclpy.init(args=args)
    node = HumanFollower()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
