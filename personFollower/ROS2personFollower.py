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
        self.publisher_ = self.create_publisher(Twist, 'cmd_vel', 10)

        # Video capture
        self.cap = cv2.VideoCapture(0)

        # Mediapipe
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils

        # FPS
        self.prev_time = time()
        self.frame_count = 0
        self.fps = 0

        # Speeds
        self.angular_speed = 0.0
        self.linear_speed = 0.0

        # Run pose estimation
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

        # Timer for loop
        self.timer = self.create_timer(0.05, self.process_frame)  # ~20 Hz

    def process_frame(self):
        error, frame = self.cap.read()
        frame = cv2.flip(frame, 1)
        if not error:
            self.get_logger().error("Camera read error")
            return

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)

        status_text = "No Person"
        twist = Twist()

        if results.pose_landmarks:
            height, width, _ = frame.shape
            middle_x, middle_y = width // 2, height // 2
            cv2.circle(frame, (middle_x, middle_y), 5, (255, 0, 0), -1)

            # Draw landmarks
            self.mp_drawing.draw_landmarks(
                frame,
                results.pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS,
                self.mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                self.mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2)
            )

            # Shoulders & hips
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
                cy = int((ly + ry) / 2 * height)

                # Angular speed
                self.angular_speed = (middle_x - cx) / middle_x
                if -0.1 < self.angular_speed < 0.1:
                    self.angular_speed = 0.0
                self.angular_speed = max(-1.0, min(1.0, self.angular_speed))

                # Depth proxy
                width_ratio = abs(rx - lx)
                SAFE_DISTANCE_RATIO = 0.25
                DANGER_DISTANCE_RATIO = 0.4

                if width_ratio > DANGER_DISTANCE_RATIO:
                    self.linear_speed = (width_ratio - DANGER_DISTANCE_RATIO) * 2
                    self.linear_speed = - max(0.0, min(1.0, self.linear_speed))
                    status_text += " - Too Close - Slow"
                elif width_ratio > SAFE_DISTANCE_RATIO:
                    self.linear_speed = 0.0
                    status_text += " - Too Close - Stop"
                else:
                    self.linear_speed = (SAFE_DISTANCE_RATIO - width_ratio) * 2
                    self.linear_speed = max(0.0, min(1.0, self.linear_speed))
                    status_text += " - Following"

                # Scale to real robot speeds
                MAX_LIN = 0.3  # m/s
                MAX_ANG = 1.0  # rad/s
                twist.linear.x = self.linear_speed * MAX_LIN
                twist.angular.z = self.angular_speed * MAX_ANG

        # Publish velocity command
        self.publisher_.publish(twist)

        # FPS counter
        self.frame_count += 1
        current_time = time()
        elapsed = current_time - self.prev_time
        if elapsed >= 1.0:
            self.fps = self.frame_count / elapsed
            self.frame_count = 0
            self.prev_time = current_time

        # Visualization
        cv2.putText(frame, f'FPS: {self.fps:.2f}', (50, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Angular: {self.angular_speed:.2f} Linear: {self.linear_speed:.2f}',
                    (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, status_text, (50, 200),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)

        cv2.imshow('Human Follower', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            self.cap.release()
            cv2.destroyAllWindows()
            rclpy.shutdown()


def main(args=None):
    rclpy.init(args=args)
    node = HumanFollower()
    rclpy.spin(node)


if __name__ == '__main__':
    main()
