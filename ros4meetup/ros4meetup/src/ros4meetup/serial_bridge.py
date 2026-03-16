import json
import threading
from typing import Optional
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from std_msgs.msg import String
import serial
from std_srvs.srv import SetBool

#!/usr/bin/env python3



class SerialBridge(Node):
    def __init__(self):
        super().__init__('serial_bridge')
        self.current_port = '/dev/ttyUSB0'  
        # === Serial setup ===
        try:
            self.serial: Optional[serial.Serial] = serial.Serial(
                port=self.current_port, 
                baudrate=115200,
                timeout=0.1,
            )
            self.get_logger().info("Serial port opened successfully.")
        except serial.SerialException as e:
            self.get_logger().error(f"Could not open serial port: {e}")
            self.serial = None

        # === ROS subscriber ===
        self.subscription = self.create_subscription(
            Twist, 'cmd_vel', self.cmd_vel_callback, 10
        )


        # Subscribe to mode selection topic
        self.mode_subscriber = self.create_subscription(
            String,
            'config',
            self.config_callback,
            10
        )

        # === ROS publisher (optional if ESP sends sensor data) ===
        self.feedback_publisher = self.create_publisher(String, 'esp_feedback', 10)

        # === Publisher for remote control commands ===
        self.remote_pub = self.create_publisher(Twist, 'remote_command', 10)

        # === Thread to constantly read serial ===
        self.keep_running = True
        self.read_thread = threading.Thread(target=self.read_serial_loop)
        self.read_thread.daemon = True
        self.read_thread.start()

    # === Callback for ROS Twist messages ===
    def cmd_vel_callback(self, msg: Twist):
        """Send Twist as JSON to the ESP32."""
        if self.serial is None:
            self.get_logger().warning("Serial port not available.")
            return
        self.get_logger().info(f"Sending to ESP32: linear={msg.linear.x}, angular={msg.angular.z}")
        data = {
            'angular_speed': int(msg.angular.z),
            'linear_speed': int(msg.linear.x),
            'xSpeed': int(msg.linear.y),  # Added x component
        }
        self.get_logger().info(f"Serialized JSON: {data}")
        json_str = json.dumps(data)
        self.serial_write(json_str)

    # === Callback for config messages ===
    def config_callback(self, msg: String):
        data = json.loads(msg.data.strip())
        requested_port = data.get("mode", "").strip()
        self.get_logger().info(f"Config change requested: {requested_port}")
        if requested_port != "" and requested_port != self.current_port:
            try:
                if self.serial and self.serial.is_open:
                    self.serial.close()
                self.serial = serial.Serial(
                    port=requested_port,
                    baudrate=115200,
                    timeout=0.1,
                )
                self.current_port = requested_port
                self.get_logger().info(f"Serial port changed to {requested_port}")
            except serial.SerialException as e:
                self.get_logger().error(f"Could not open serial port {requested_port}: {e}")
                self.serial = None

    # === Serial writing helper ===
    def serial_write(self, data_str: str):
        """Send JSON over serial with newline terminator."""
        if self.serial is None:
            self.get_logger().warning("Attempted to write but serial is not open.")
            return
        try:
            self.serial.write((data_str + "\n").encode('utf-8'))
        except Exception as e:
            self.get_logger().error(f"Error writing to serial: {e}")

    # === Background thread to read data from ESP32 ===
    def read_serial_loop(self):
        """Continuously read messages from ESP32."""
        if self.serial is None:
            return

        while self.keep_running:
            try:
                line = self.serial.readline().decode('utf-8').strip()
                if not line:
                    continue

                self.get_logger().info(f"From ESP32: {line}")
                try:
                    message = json.loads(line)
                except json.JSONDecodeError:
                    self.get_logger().warning("Received non-JSON line from serial.")
                    continue

                if message.get("mode"):
                    response = self.send_request(message["mode"])
                    if response:
                        self.get_logger().info(f"Config response: {response.data}")

                if message.get("feedback"):
                    feedback_msg = String()
                    feedback_msg.data = message["feedback"]
                    self.feedback_publisher.publish(feedback_msg)

                if message.get("remote_control"):
                    msg = Twist()
                    msg.linear.x = float(message["remote_control"].get("x", 0.0))
                    msg.angular.z = float(message["remote_control"].get("z", 0.0))
                    self.get_logger().info("Publishing remote control command")
                    self.remote_pub.publish(msg)

            except Exception as e:
                # Keep reading even if intermittent errors occur
                self.get_logger().warning(f"Serial read error: {e}")

    # === Service client to change mode ===
    def send_request(self, mode: str):
        if not self.config_client.wait_for_service(timeout_sec=1.0):
            self.get_logger().error("Config service not available")
            return None
        self.req.data = mode
        self.future = self.config_client.call_async(self.req)
        rclpy.spin_until_future_complete(self, self.future)
        return self.future.result()

    # === Graceful shutdown ===
    def destroy_node(self):
        self.keep_running = False
        if self.serial and self.serial.is_open:
            try:
                self.serial.close()
            except Exception:
                pass
        super().destroy_node()


def main(args=None):
    rclpy.init(args=args)
    node = SerialBridge()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
