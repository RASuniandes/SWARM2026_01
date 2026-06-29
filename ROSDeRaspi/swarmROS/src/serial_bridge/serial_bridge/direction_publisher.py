#!/usr/bin/env python3
import rclpy, sys
from rclpy.node import Node
from std_msgs.msg import String

class CmdPub(Node):
    def __init__(self):
        super().__init__('cmd_pub')
        self.pub = self.create_publisher(String, 'cmd_dir', 10)
        self.timer = self.create_timer(1.0, self.send)

    def send(self):
        msg = String()
        msg.data = sys.argv[1] if len(sys.argv) > 1 else 'FORWARD'
        self.pub.publish(msg)

def main(args=None):
    rclpy.init(args=args)
    node = CmdPub()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()

