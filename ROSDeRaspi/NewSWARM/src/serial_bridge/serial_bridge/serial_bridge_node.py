#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
import serial, threading
from utils.consts import Consts, Movement

class SerialBridge(Node):
    def __init__(self):
        super().__init__('serial_bridge')
        self.port = serial.Serial(Consts.serial_port, Consts.serial_baudrate, timeout=Consts.serial_timeout)
        self.sub = self.create_subscription(
            String, Consts.movement_topic, self.cmd_cb, 10)
        self.pub = self.create_publisher(String, Consts.feedback_topic, 10)
        threading.Thread(target=self.read_serial,
                        daemon=True).start()

    def cmd_cb(self, msg: String):
        cmd = msg.data.strip()
        self.get_logger().info(f'Received command: {cmd}')
        json = Movement.to_json(cmd)
        if json['direction'] not in Movement.valid_directions:
            self.get_logger().error(f'Invalid direction: {json["direction"]}')
            return
        command = Movement.format_command(json['direction'], json['speed'], json['angle'])
        self.get_logger().info(f'Sending command to serial: {command.strip()}')
        try:
            self.port.write(command.encode())
        except serial.SerialException as e:
            self.get_logger().error(f'Serial write failed: {e}')

        

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
