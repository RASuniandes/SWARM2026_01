#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from sensor_msgs.msg import LaserScan


class AutonomousController(Node):
    def __init__(self):
        super().__init__('autonomous_controller')
        self.publisher_ = self.create_publisher(Twist, 'autonomous_command', 10)
        self.subscription = self.create_subscription(
            LaserScan,
            'laser_scan',
            self.laser_callback,
            10
        )

        # Speed settings (0–100)
        self.linear_speed = 70.0
        self.angular_speed = 70.0
        self.min_distance = 0.5  # meters — threshold for obstacle avoidance

        self.get_logger().info("🤖 Autonomous controller started (max speed = 100)")

        # Internal state
        self.obstacle_detected = False
        self.turning_direction = 1  # 1 = left, -1 = right



    def laser_callback(self, msg: LaserScan):
        """Process LiDAR readings and detect obstacles."""
        num_points = len(msg.ranges)
        front = msg.ranges[num_points // 2 - 10:num_points // 2 + 10]
        left = msg.ranges[:30]
        right = msg.ranges[-30:]

        # Replace inf values with something large
        front = [r if r < float('inf') else 5.0 for r in front]
        left = [r if r < float('inf') else 5.0 for r in left]
        right = [r if r < float('inf') else 5.0 for r in right]

        min_front = min(front)
        min_left = min(left)
        min_right = min(right)

        if min_front < self.min_distance:
            self.obstacle_detected = True
            self.turning_direction = -1 if min_left < min_right else 1
        else:
            self.obstacle_detected = False

    def publish_command(self):
        """Publish Twist message depending on LiDAR input."""
        twist = Twist()

        if self.obstacle_detected:
            twist.linear.x = 0.0
            twist.angular.z = self.angular_speed * self.turning_direction
            status = "🚧 Obstacle detected – turning"
        else:
            twist.linear.x = self.linear_speed
            twist.angular.z = 0.0
            status = "➡️ Moving forward"

        self.publisher_.publish(twist)
        self.get_logger().info(f"{status}: linear={twist.linear.x:.1f}, angular={twist.angular.z:.1f}")

    def destroy_node(self):
        """Stop robot on shutdown."""
        stop = Twist()
        self.publisher_.publish(stop)
        super().destroy_node()


def main(args=None):
    rclpy.init(args=args)
    node = AutonomousController()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
