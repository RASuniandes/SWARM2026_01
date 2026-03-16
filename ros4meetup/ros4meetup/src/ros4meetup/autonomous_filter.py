#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from sensor_msgs.msg import LaserScan


class AutonomousFilter(Node):
    def __init__(self):
        super().__init__('autonomous_filter')

        # Subscriptions
        self.cmd_sub = self.create_subscription(Twist, '/cmd_vel', self.cmd_callback, 10)
        self.scan_sub = self.create_subscription(LaserScan, '/laser_scan', self.scan_callback, 10)

        # Publisher
        self.safe_pub = self.create_publisher(Twist, '/cmd_parsed_vel', 10)

        # Parameters
        self.safe_distance = 0.4  # meters
        self.min_distance = float('inf')

        # Flags
        self.has_cmd = False
        self.has_scan = False

        self.get_logger().info('🤖 Autonomous Filter active (listening to /cmd_vel and /scan)')

    def scan_callback(self, msg: LaserScan):
        """Receives laser scan data and finds closest obstacle in front area."""
        num_points = len(msg.ranges)
        center = num_points // 2
        window = 15  # check ±15° around front
        valid_ranges = [
            msg.ranges[i] for i in range(center - window, center + window)
            if msg.ranges[i] > 0.0 and msg.ranges[i] < float('inf')
        ]
        if valid_ranges:
            self.min_distance = min(valid_ranges)
        else:
            self.min_distance = float('inf')
        self.has_scan = True

    def cmd_callback(self, msg: Twist):
        """Receives /cmd_vel and applies obstacle avoidance."""
        self.has_cmd = True

        # If we haven't received any LIDAR data yet → ignore
        if not self.has_scan:
            self.get_logger().warn("🚫 No LIDAR data yet — ignoring /cmd_vel")
            return

        safe_cmd = Twist()
        safe_cmd.linear.x = msg.linear.x
        safe_cmd.angular.z = msg.angular.z

        # Stop forward motion if obstacle detected
        if self.min_distance < self.safe_distance and msg.linear.x > 0:
            self.get_logger().warn(
                f"⚠️ Obstacle {self.min_distance:.2f}m ahead — stopping forward motion"
            )
            safe_cmd.linear.x = 0.0

        # Limit speeds to ±100
        safe_cmd.linear.x = max(min(safe_cmd.linear.x, 100.0), -100.0)
        safe_cmd.angular.z = max(min(safe_cmd.angular.z, 100.0), -100.0)

        # Publish safe command
        self.safe_pub.publish(safe_cmd)


def main(args=None):
    rclpy.init(args=args)
    node = AutonomousFilter()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        node.get_logger().info('🛑 Autonomous Filter stopped by user.')
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
