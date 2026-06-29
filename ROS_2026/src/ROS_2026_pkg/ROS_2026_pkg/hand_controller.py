#!/usr/bin/env python3
import rclpy
from rclpy.lifecycle import LifecycleNode, State, TransitionCallbackReturn
from geometry_msgs.msg import Twist
from std_msgs.msg import String
import mediapipe as mp
import cv2
from time import time

class HandDetector:
    def __init__(self, mode=False, maxHands=2, modelComplexity=0, detectionCon=0.5, trackCon=0.5):
        self.mode = mode
        self.maxHands = maxHands
        self.detectionCon = float(detectionCon)  
        self.trackCon = float(trackCon)          
        self.modelComplexity = modelComplexity
        self.mpHands = mp.solutions.hands
        self.hands = self.mpHands.Hands(self.mode, self.maxHands, self.modelComplexity, self.detectionCon, self.trackCon)
        self.mpDraw = mp.solutions.drawing_utils
    
    def findHands(self, img, draw=False):
        imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        self.results = self.hands.process(imgRGB)
        if self.results.multi_hand_landmarks:
            for handLms in self.results.multi_hand_landmarks:
                if draw:
                    self.mpDraw.draw_landmarks(img, handLms, self.mpHands.HAND_CONNECTIONS)
        return img
    
    def findPosition(self, img, handNo=0, draw=False):
        lmList = []
        if hasattr(self, 'results') and self.results.multi_hand_landmarks:
            myHand = self.results.multi_hand_landmarks[handNo]
            for id, lm in enumerate(myHand.landmark):
                h, w, c = img.shape
                cx, cy, cz = int(lm.x * w), int(lm.y * h), int(lm.z * w)
                lmList.append([id, cx, cy, cz])
                if draw:
                    cv2.circle(img, (cx, cy), 15, (255, 0, 255), cv2.FILLED)
        return lmList
    
    def findDistance(self, p1, p2, img, draw=False, r=15, t=3, round_val=True, position=(10, 100)):    
        x1, y1 = p1[1], p1[2]
        x2, y2 = p2[1], p2[2]
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2 
        length = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5 
        if round_val:
            length = int(length)
        if draw:
            cv2.line(img, (x1, y1), (x2, y2), (255, 0, 255), t)
            cv2.circle(img, (x1, y1), r, (255, 0, 255), cv2.FILLED)
            cv2.circle(img, (x2, y2), r, (255, 0, 255), cv2.FILLED)
            cv2.circle(img, (cx, cy), r, (0, 0, 255), cv2.FILLED)
            cv2.putText(img, f'Distancia: {length}', position, cv2.FONT_HERSHEY_PLAIN, 3, (255, 0, 255), 3)
        return length, img
    
    def findFingersUp(self, img, draw=False, handNo=0, position=(10, 100)):
        lmList = []
        if self.results.multi_hand_landmarks:
            handLms = self.results.multi_hand_landmarks[handNo]
            fingers = [0, 0, 0, 0, 0]
            if handLms.landmark[4].y < handLms.landmark[3].y: fingers[0] = 1
            if handLms.landmark[8].y < handLms.landmark[6].y: fingers[1] = 1
            if handLms.landmark[12].y < handLms.landmark[10].y: fingers[2] = 1
            if handLms.landmark[16].y < handLms.landmark[14].y: fingers[3] = 1
            if handLms.landmark[20].y < handLms.landmark[18].y: fingers[4] = 1
            lmList = fingers
            if draw:
                self.mpDraw.draw_landmarks(img, handLms, self.mpHands.HAND_CONNECTIONS)
                cv2.putText(img, f'Dedos: {lmList}', (position[0], position[1] + 50), 
                            cv2.FONT_HERSHEY_PLAIN, 3, (255, 0, 255), 3)
        return lmList, img

    def findDirectionOfHand(self, img, draw=False, handNo=0, position=(10, 100)):
        direction = ['', '', '']
        amount = [0, 0, 0]
        if hasattr(self, 'results') and self.results.multi_hand_landmarks:
            handLms = self.results.multi_hand_landmarks[handNo]

            indexFingerIndex = 8
            indexFinger = handLms.landmark[indexFingerIndex]
            indexFingerDipIndex = 7      
            indexFingerDip = handLms.landmark[7]
            
            xValues = list(map(lambda x: x.x, handLms.landmark))
            yValues = list(map(lambda x: x.y, handLms.landmark))
            zValues = list(map(lambda x: x.z, handLms.landmark))
            
            maxXIndex = xValues.index(max(xValues))
            maxYIndex = yValues.index(max(yValues))
            maxZIndex = zValues.index(max(zValues))
            minXIndex = xValues.index(min(xValues))
            minYIndex = yValues.index(min(yValues))
            minZIndex = zValues.index(min(zValues))
            
            indexFingerList = [indexFingerIndex, indexFinger.x, indexFinger.y, indexFinger.z]
            indexFingerDipList = [indexFingerDipIndex, indexFingerDip.x, indexFingerDip.y, indexFingerDip.z]
            
            def rounded(attribute):
                dist = self.findDistance(indexFingerList, indexFingerDipList, img, draw=False, round_val=False)[0]
                if dist == 0: return 0.0
                return round((getattr(indexFingerDip, attribute) - getattr(indexFinger, attribute)) / dist, 2) * 100

            if maxXIndex == indexFingerIndex:
                direction[0] = 'Izquierda'
                amount[0] = rounded("x")  
            elif minXIndex == indexFingerIndex:
                direction[0] = 'Derecha'
                amount[0] = rounded("x")  
                
            if maxYIndex == indexFingerIndex:
                direction[1] = 'Abajo'
                amount[1] = rounded("y")  
            elif minYIndex == indexFingerIndex:
                direction[1] = 'Arriba'
                amount[1] = rounded("y")  
                
            if maxZIndex == indexFingerIndex:
                direction[2] = 'Lejos'
                amount[2] = rounded("z")  
            elif minZIndex == indexFingerIndex:
                direction[2] = 'Cerca'
                amount[2] = rounded("z")  

            if draw:
                h, w, c = img.shape
                x, y = (int(indexFinger.x * w), int(indexFinger.y * h))
                cv2.circle(img, (x, y), 15, (255, 0, 0), cv2.FILLED)
                cv2.putText(img, f'Direccion: {direction}', (position[0], position[1] + 50), 
                            cv2.FONT_HERSHEY_PLAIN, 3, (255, 0, 255), 3)
                cv2.putText(img, f'Cantidad: {amount}', (position[0], position[1] + 100), 
                            cv2.FONT_HERSHEY_PLAIN, 3, (255, 0, 255), 3)
        return img, direction, amount


class HandController(LifecycleNode):
    def __init__(self):
        super().__init__("hand_controller")
        self.publisher_ = None
        self.timer_ = None
        self.twist = Twist()
        self.detector = None
        self.cap = None

        # Parametric configurations fields
        self.camera_index = 0
        self.display_feed = True
        self.max_linear_vel = 1.0
        self.max_angular_vel = 1.0
        self.deadzone_value = 5.0
        self.sensitivity_scale = 0.01 

        # FPS analytics metrics trackers
        self.prev_time = time()
        self.frame_count = 0
        self.fps = 0.0

        self.get_logger().info("🖐️ Hand Tracking Lifecycle Controller initialized. Awaiting transition...")

    def on_configure(self, state: State) -> TransitionCallbackReturn:
        self.get_logger().info("Configuring parameters and vision tracking pipelines...")

        # 1. Declare Node parameters
        self.declare_parameter('camera_index', 0)
        self.declare_parameter('display_feed', True)
        self.declare_parameter('max_linear_vel', 1.0)
        self.declare_parameter('max_angular_vel', 1.0)
        self.declare_parameter('deadzone', 5.0)
        self.declare_parameter('sensitivity', 0.02)

        # 2. Extract parameter definitions
        self.camera_index = self.get_parameter('camera_index').value
        self.display_feed = self.get_parameter('display_feed').value
        self.max_linear_vel = self.get_parameter('max_linear_vel').value
        self.max_angular_vel = self.get_parameter('max_angular_vel').value
        self.deadzone_value = self.get_parameter('deadzone').value
        self.sensitivity_scale = self.get_parameter('sensitivity').value

        # 3. Create active publishers matching lifecycle pattern
        self.publisher_ = self.create_lifecycle_publisher(Twist, "hand_command", 10)

        # 4. Open hardware camera device dynamically via parsed parameter
        self.cap = cv2.VideoCapture(self.camera_index)
        if not self.cap.isOpened():
            self.get_logger().error(f"Hardware Fault: Unable to open capture hardware device stream index: {self.camera_index}")
            return TransitionCallbackReturn.FAILURE

        # 5. Safe model processing context instantiation
        self.detector = HandDetector()

        self.get_logger().info("🖐️ Hardware layers and processing parameters configured successfully.")
        return TransitionCallbackReturn.SUCCESS

    def on_activate(self, state: State) -> TransitionCallbackReturn:
        self.get_logger().info("Activating hand controller tracking frame processing loops.")
        self.publisher_.on_activate()
        
        # Deploy a stable 10Hz execution frame timer context handle
        self.timer_ = self.create_timer(0.1, self.process_frame)
        return TransitionCallbackReturn.SUCCESS

    def on_deactivate(self, state: State) -> TransitionCallbackReturn:
        self.get_logger().info("Deactivating hand processing loops safely...")
        
        if self.timer_:
            self.timer_.cancel()
            self.destroy_timer(self.timer_)
            self.timer_ = None

        self.stop_robot()
        self.publisher_.on_deactivate()
        
        if self.display_feed:
            cv2.destroyAllWindows()
            
        return TransitionCallbackReturn.SUCCESS

    def on_cleanup(self, state: State) -> TransitionCallbackReturn:
        self.get_logger().info("Executing hardware layer cleanup routines...")
        self.free_resources()
        
        if self.publisher_:
            self.destroy_publisher(self.publisher_)
        return TransitionCallbackReturn.SUCCESS

    def on_shutdown(self, state: State) -> TransitionCallbackReturn:
        self.get_logger().info("Shutting down context environment completely...")
        self.free_resources()
        return TransitionCallbackReturn.SUCCESS

    def free_resources(self):
        try:
            if self.cap and self.cap.isOpened():
                self.cap.release()
                self.cap = None
            cv2.destroyAllWindows()
            self.get_logger().info("Active device handles released from system focus.")
        except Exception as e:
            self.get_logger().warn(f"Exception encountered during tracking layer teardown: {e}")

    def process_frame(self):
        if self.cap is None or not self.cap.isOpened():
            return

        ret, frame = self.cap.read()
        if not ret or frame is None:
            self.get_logger().error("Hardware error reading current capture buffer handle stream.")
            return

        frame = cv2.flip(frame, 1)

        # Execute coordinate frames feature mappings
        frame = self.detector.findHands(frame, draw=self.display_feed)
        lmList = self.detector.findPosition(frame, draw=self.display_feed)
        frame, direction, amount = self.detector.findDirectionOfHand(frame, draw=self.display_feed)

        twist = Twist()
        status = "No Hand Detected"

        if len(lmList) != 0:
            dir_x, dir_y, dir_z = direction
            amt_x, amt_y, amt_z = amount

            status = f"{dir_x} {dir_y} {dir_z}"

            # --- Deadzone Filters & Proportional Sensitivity Calculation ---
            # Linear Y mapping (Arriba/Abajo displacement mapping)
            if abs(amt_y) < self.deadzone_value:
                raw_linear_x = 0.0
            else:
                raw_linear_x = float(amt_y) * self.sensitivity_scale

            # Linear X mapping (Izquierda/Derecha displacement mapping)
            if abs(amt_x) < self.deadzone_value:
                raw_linear_y = 0.0
            else:
                raw_linear_y = float(amt_x) * self.sensitivity_scale

            # Enforce max velocity parameter caps safely
            twist.linear.x = max(-self.max_linear_vel, min(self.max_linear_vel, raw_linear_x))
            twist.linear.y = max(-self.max_linear_vel, min(self.max_linear_vel, raw_linear_y))
            twist.angular.z = 0.0     

            if self.publisher_ and self.publisher_.is_activated():
                self.publisher_.publish(twist)
                self.get_logger().info(
                    f"Tracking: {status} | Vx:{twist.linear.x:.2f} Vy:{twist.linear.y:.2f}"
                )
        else:
            self.stop_robot()
            self.get_logger().info("No Hand In Field of View | Safe Stop Command Issued")

        # --- Render GUI on-screen display if toggled True ---
        if self.display_feed:
            self.update_fps()
            cv2.putText(frame, f"FPS: {int(self.fps)}", (10, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 255), 2)
            cv2.putText(frame, f"Status: {status}", (10, 80),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.imshow("Hand Tracking Lifecycle Interface", frame)
            cv2.waitKey(1)

    def stop_robot(self):
        self.twist.linear.x = 0.0
        self.twist.linear.y = 0.0
        self.twist.angular.z = 0.0
        if self.publisher_ and self.publisher_.is_activated():
            self.publisher_.publish(self.twist)

    def update_fps(self):
        self.frame_count += 1
        elapsed = time() - self.prev_time
        if elapsed >= 1.0:
            self.fps = self.frame_count / elapsed
            self.frame_count = 0
            self.prev_time = time()


def main(args=None):
    rclpy.init(args=args)
    lifecycle_node = HandController()
    try:
        rclpy.spin(lifecycle_node)
    except KeyboardInterrupt:
        pass
    finally:
        lifecycle_node.free_resources()
        lifecycle_node.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()