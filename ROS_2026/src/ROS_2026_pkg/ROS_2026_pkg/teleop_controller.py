import sys
import termios
import tty
import select
import rclpy
from rclpy.lifecycle import LifecycleNode, State, TransitionCallbackReturn
from geometry_msgs.msg import Twist
from std_msgs.msg import String

class TeleopController(LifecycleNode):
    def __init__(self):
        super().__init__('teleop_controller')
        self.publisher_ = None
        self.router_listener = None
        self.timer_ = None  # Replaces the blocking while loop
        self.twist = Twist()
        
        self.linear_speed = 0.0 
        self.angular_speed = 0.0  
        self.get_logger().info("🕹️ Teleop controller initialized. Awaiting Lifecycle transition...")

    def on_configure(self, state: State) -> TransitionCallbackReturn:
        self.get_logger().info('Configuring the node...')
        self.publisher_ = self.create_lifecycle_publisher(Twist, 'cmd_teleop', 10)
        
        self.declare_parameter('linear_speed', 1.0) # Swapped default to a manageable 1.0 m/s
        self.declare_parameter('angular_speed', 1.0)
        self.linear_speed = self.get_parameter('linear_speed').value
        self.angular_speed = self.get_parameter('angular_speed').value
        
        self.router_listener = self.create_subscription(String, 'router_listener', self.router_callback, 10)
        return TransitionCallbackReturn.SUCCESS

    def on_activate(self, state: State) -> TransitionCallbackReturn:
        self.get_logger().info('Activating the node. Use W/A/S/D to move, Q to stop.')        
        # Start a 20Hz non-blocking timer loop for reading keys
        self.timer_ = self.create_timer(0.05, self.teleop_loop) 
        return TransitionCallbackReturn.SUCCESS
    
    def on_deactivate(self, state: State) -> TransitionCallbackReturn:
        self.get_logger().info('Deactivating the node...')
        # Stop and clean up the input loop timer immediately
        if self.timer_:
            self.destroy_timer(self.timer_)
        self.get_logger().info("Input loop timer destroyed. Node deactivated.")
        # Stop motors safely before leaving active state
        self.stop_robot()
        self.get_logger().info("Robot movement stopped. Node deactivated.")
        return TransitionCallbackReturn.SUCCESS

    def on_cleanup(self, state: State) -> TransitionCallbackReturn:
        self.get_logger().info('Cleaning up the node...')
        if self.publisher_:
            self.destroy_publisher(self.publisher_)
        if self.router_listener:
            self.destroy_subscription(self.router_listener)
        return TransitionCallbackReturn.SUCCESS

    def on_shutdown(self, state: State) -> TransitionCallbackReturn:
        self.get_logger().info('Shutting down the node...')
        if self.publisher_:
            self.destroy_publisher(self.publisher_)
        if self.router_listener:
            self.destroy_subscription(self.router_listener)
        return TransitionCallbackReturn.SUCCESS

    def get_key(self, timeout=0.01): # Lower timeout keeps the main spinning thread responsive
        fd = sys.stdin.fileno()
        old_attrs = termios.tcgetattr(fd)
        try:
            tty.setraw(fd)
            rlist, _, _ = select.select([sys.stdin], [], [], timeout)
            if rlist:
                return sys.stdin.read(1)
            return ''
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_attrs)

    def teleop_loop(self):
        """Executes once every 50ms inside rclpy.spin framework"""
        key = self.get_key()
        if not key:
            return

        if key == 'w':
            self.twist.linear.x = self.linear_speed
            self.twist.angular.z = 0.0
        elif key == 's':
            self.twist.linear.x = -self.linear_speed
            self.twist.angular.z = 0.0
        elif key == 'a':
            self.twist.linear.x = 0.0
            self.twist.angular.z = self.angular_speed
        elif key == 'd':
            self.twist.linear.x = 0.0
            self.twist.angular.z = -self.angular_speed
        elif key == ' ':
            self.stop_robot()
        elif key == 'q':
            self.get_logger().info("👋 Input 'q' received. Halting robot movement.")
            self.stop_robot()
            return
        self.get_logger().info(f"Key pressed: {key} | Linear: {self.twist.linear.x:.2f}, Angular: {self.twist.angular.z:.2f}")
        self.publisher_.publish(self.twist)

    def stop_robot(self):
        self.twist.linear.x = 0.0
        self.twist.angular.z = 0.0
        if self.publisher_:
            self.publisher_.publish(self.twist)

    def router_callback(self, msg):
        self.get_logger().info(f"Router heartbeat tracking mode: {msg.data}")


def main(args=None):
    rclpy.init(args=args)
    lifecycle_node = TeleopController()
    rclpy.spin(lifecycle_node)
    lifecycle_node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()