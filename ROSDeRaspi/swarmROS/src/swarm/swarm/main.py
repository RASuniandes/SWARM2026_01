#!/usr/bin/env python3
import math, serial, rclpy
from rclpy.node import Node
from std_msgs.msg import String
from sensor_msgs.msg import LaserScan
from rclpy.qos import QoSProfile

class MovementBridge(Node):
    def __init__(self):
        super().__init__('movement_bridge')
        self.port = serial.Serial('/dev/ttyUSB0', 115200, write_timeout=0)
        qos = QoSProfile(depth=100)
        self.create_subscription(String, 'movement', self.cb_movement, qos)
        self.create_subscription(LaserScan, 'scan', self.cb_scan, 10)
        self.threshold = 0.4
        self.angles = {'W':0.0,'A':math.pi/2,'S':math.pi,'D':-math.pi/2}
        self.restricted = set()

    def cb_movement(self, msg):
        c = msg.data[:1].upper()
        if c in 'WASD' and c not in self.restricted:
            self.port.write(c.encode())
            self.get_logger().info({'W':'forward','A':'left','S':'backward','D':'right'}[c])
        elif c in self.restricted:
            self.get_logger().warn(f'Blocked move: {c}')

    def cb_scan(self, msg):
        new_r = set()
        for k,ang in self.angles.items():
            idx = int(round((ang-msg.angle_min)/msg.angle_increment))
            if 0<=idx<len(msg.ranges):
                r = msg.ranges[idx]
                if math.isfinite(r) and r<self.threshold:
                    new_r.add(k)
        self.restricted = new_r

def main(args=None):
    rclpy.init(args=args)
    node = MovementBridge()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__=='__main__':
    main()

