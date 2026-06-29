#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from std_msgs.msg import String
import json

class ControllerRouter(Node):
    def __init__(self):
        super().__init__('controller_router')

        self.valid_modes = ['remote', 'autonomous', 'vision', 'web', 'teleop', 'hand']
        self.current_mode = 'teleop'  # Default mode

        # Publisher to cmd_vel
        self.publisher = self.create_publisher(Twist, 'cmd_vel', 10)

        # Subscribe to mode selection topic
        self.mode_subscriber = self.create_subscription(
            String,
            'config',
            self.mode_callback,
            10
        )

        # Initial subscriber for command topic
        self.current_subscriber = self.create_subscription(
            Twist,
            f'{self.current_mode}_command',
            self.controller_selection_callback,
            10
        )

        self.get_logger().info(f"Router started in '{self.current_mode}' mode")

    def controller_selection_callback(self, msg: Twist):
        """Forwards Twist messages from the current mode topic to cmd_vel"""
        self.get_logger().info(
            f"Routing from {self.current_mode}: linear={msg.linear.x:.2f}, angular={msg.angular.z:.2f}"
        )
        self.publisher.publish(msg)

    def mode_callback(self, msg: String):
        """Switch control mode when receiving a message on the 'config' topic"""
        data = json.loads(msg.data.strip())
        requested_mode = data.get("mode", "").strip()
        self.get_logger().info(f"Mode change requested: {requested_mode}")

        if requested_mode in self.valid_modes:
            # Destroy previous subscriber safely
            if getattr(self, 'current_subscriber', None) is not None:
                try:
                    self.destroy_subscription(self.current_subscriber)
                except Exception as e:
                    self.get_logger().warn(f"Error removing old subscriber: {e}")

            # Switch mode
            self.current_mode = requested_mode
            self.current_subscriber = self.create_subscription(
                Twist,
                f'{self.current_mode}_command',
                self.controller_selection_callback,
                10
            )

            self.get_logger().info(f"✅ Mode changed to '{self.current_mode}'")
        else:
            self.get_logger().warn(f"❌ Invalid mode requested: '{requested_mode}'")


def main(args=None):
    rclpy.init(args=args)
    node = ControllerRouter()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
