import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from std_msgs.msg import String
import sys

class FacesDirectionNode(Node):
    def __init__(self):
        super().__init__('faces_direction_node')

        # Subscribe to robot velocity topic
        self.subscription = self.create_subscription(
            Twist,
            '/cmd_vel',      # Topic from your robot
            self.listener_callback,
            10
        )

        # Publish to the topic the ESP32 listens to
        self.publisher = self.create_publisher(String, '/faces_direction', 10)

        self.get_logger().info('faces_direction_node started (listening to /cmd_vel, publishing to /faces_direction)')

    def listener_callback(self, msg: Twist):
        linear_x = msg.linear.x
        angular_z = msg.angular.z

        # Thresholds to reduce noise
        linear_thresh = 1.0
        angular_thresh = 1.0

        direction = "none"

        # Detect direction
        if abs(linear_x) > linear_thresh:
            if linear_x > 0:
                direction = "front"
            elif linear_x < 0:
                direction = "back"
        elif abs(angular_z) > angular_thresh:
            if angular_z > 0:
                direction = "left"
            elif angular_z < 0:
                direction = "right"
        else:
            direction = "none"

        # Log and publish
        sys.stdout.write(f"\rlinear.x={linear_x:.2f}, angular.z={angular_z:.2f} → {direction:<6}")
        sys.stdout.flush()
        msg_out = String()
        msg_out.data = direction
        self.publisher.publish(msg_out)

def main(args=None):
    rclpy.init(args=args)
    node = FacesDirectionNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
