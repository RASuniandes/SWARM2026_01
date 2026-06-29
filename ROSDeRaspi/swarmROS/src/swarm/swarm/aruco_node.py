# File: src/swarm_control/swarm_control/aruco_node.py
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
import cv2
from cv2 import aruco
import numpy as np

class ArucoDetector(Node):
    def __init__(self):
        super().__init__('aruco_detector')
        self.pub=self.create_publisher(String,'arucos',10)
        self.cap=cv2.VideoCapture(1)
        calib = np.load('/home/raspi/swarmROS/src/swarm/swarm/MultiMatrix.npz')
        self.cam_mat=calib['camMatrix']
        self.dist_coef=calib['distCoef']
        self.dict=aruco.getPredefinedDictionary(aruco.DICT_4X4_50)
        self.params=aruco.DetectorParameters()
        self.SIZE=14
        self.create_timer(0.1,self.callback)
    def callback(self):
        ret,frame=self.cap.read()
        if not ret:
            return
        gray=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)
        corners,ids,_=aruco.detectMarkers(gray,self.dict,parameters=self.params)
        if ids is not None:
            rvecs,tvecs,_=aruco.estimatePoseSingleMarkers(corners,self.SIZE,self.cam_mat,self.dist_coef)
            for i,id_arr in enumerate(ids):
                mid=int(id_arr[0])
                dist=round(float(np.linalg.norm(tvecs[i][0])),2)
                c=corners[i].reshape(4,2).mean(axis=0).astype(int)
                dx=int(c[0]-frame.shape[1]/2)
                dy=int(c[1]-frame.shape[0]/2)
                msg=String()
                msg.data=f'Marker {mid} - Distance: {dist}cm | X: {dx}px Y: {dy}px'
                self.pub.publish(msg)
                self.get_logger().info(msg.data)

def main(args=None):
    rclpy.init(args=args)
    node=ArucoDetector()
    rclpy.spin(node)
    node.cap.release()
    rclpy.shutdown()
