#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
import serial, threading

class SerialBridge(Node):
    def __init__(self):
        super().__init__('serial_bridge')
        self.port = serial.Serial('/dev/ttyACM0', 115200, timeout=0.1)
        self.sub = self.create_subscription(
            String, 'cmd_dir', self.cmd_cb, 10)
        self.pub = self.create_publisher(String, 'esp_feedback', 10)
        threading.Thread(target=self.read_serial,
                         daemon=True).start()

    def cmd_cb(self, msg):
        mapping = {'FORWARD': 'F', 'BACKWARD': 'B',
                   'RIGHT': 'R', 'LEFT': 'L'}
        key = msg.data.strip().upper()
        if key in mapping:
            self.port.write(mapping[key].encode())

    def read_serial(self):
        while rclpy.ok():
            if (line := self.port.readline()):
                self.pub.publish(String(data=line.decode(errors='ignore')))

def main(args=None):
    rclpy.init(args=args)
    node = SerialBridge()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
