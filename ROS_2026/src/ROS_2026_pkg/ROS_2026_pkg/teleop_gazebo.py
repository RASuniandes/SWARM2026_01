#!/usr/bin/env python3
import sys
import termios
import tty
import select
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist

class RemoteController(Node):
    def __init__(self):
        super().__init__('remote_controller')
        self.publisher_ = self.create_publisher(Twist, 'cmd_vel', 10)
        self.linear_speed = 1.0  # m/s
        self.angular_speed = 1.0  # rad/s
        self.get_logger().info("🕹️ Remote controller started. Use W/A/S/D to move, Space to stop, Q to quit.")
        self.run()

    def get_key(self, timeout=0.1):
        """Non-blocking key reader, returns '' if no key pressed."""
        fd = sys.stdin.fileno()
        old_attrs = termios.tcgetattr(fd)
        try:
            tty.setraw(fd)
            # This acts as our loop delay (10Hz max). No need for time.sleep!
            rlist, _, _ = select.select([sys.stdin], [], [], timeout)
            if rlist:
                return sys.stdin.read(1)
            return ''
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_attrs)

    def run(self):
        twist = Twist()
        try:
            while rclpy.ok():
                key = self.get_key()
                
                if key == 'w':
                    twist.linear.x = self.linear_speed
                    twist.angular.z = 0.0
                elif key == 's':
                    twist.linear.x = -self.linear_speed
                    twist.angular.z = 0.0
                elif key == 'a':
                    twist.linear.x = 0.0
                    twist.angular.z = self.angular_speed
                elif key == 'd':
                    twist.linear.x = 0.0
                    twist.angular.z = -self.angular_speed
                elif key == ' ':
                    twist.linear.x = 0.0
                    twist.angular.z = 0.0
                elif key == 'q':
                    self.get_logger().info("👋 Exiting remote control.")
                    break
                elif key != '':
                    # ignore other keys
                    continue

                # Publish current command (happens at 10Hz due to the timeout in get_key)
                self.publisher_.publish(twist)
                
                # Only log to the terminal if a valid key was actually pressed 
                # (Prevents terminal lag from print spamming)
                if key != '':
                    self.get_logger().info(
                        f"Published linear={twist.linear.x:.2f}, angular={twist.angular.z:.2f}"
                    )
                    
        except KeyboardInterrupt:
            self.get_logger().info("Interrupted, shutting down.")
        finally:
            # ensure stop command on exit
            twist.linear.x = 0.0
            twist.angular.z = 0.0
            self.publisher_.publish(twist)

def main(args=None):
    rclpy.init(args=args)
    node = RemoteController()
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()