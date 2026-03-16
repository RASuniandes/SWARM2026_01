#!/usr/bin/env python3
"""
YDLidar X4 ROS2 Publisher Node
Continuously reads from YDLidar X4 and publishes LaserScan messages
"""

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan
import PyLidar3
import numpy as np
import math

class YDLidarPublisher(Node):
    def __init__(self):
        super().__init__('ydlidar_publisher')
        
        # Declarar parámetros configurables
        self.declare_parameter('port', '/dev/ttyUSB0')
        self.declare_parameter('frame_id', 'laser_frame')
        self.declare_parameter('scan_frequency', 10.0)  # Hz
        
        # Obtener parámetros
        self.port = self.get_parameter('port').value
        self.frame_id = self.get_parameter('frame_id').value
        scan_freq = self.get_parameter('scan_frequency').value
        
        # Crear publisher
        self.publisher_ = self.create_publisher(LaserScan, 'scan', 10)
        
        # Conectar al LiDAR
        self.lidar = PyLidar3.YdLidarX4(self.port)
        
        if not self.lidar.Connect():
            self.get_logger().error(f'Error: No se pudo conectar al LiDAR en {self.port}')
            self.get_logger().error('Verifique que el dispositivo esté conectado y tenga permisos')
            raise RuntimeError('Failed to connect to LiDAR')
        
        # Obtener información del dispositivo
        device_info = self.lidar.GetDeviceInfo()
        self.get_logger().info(f'Dispositivo conectado: {device_info}')
        
        # Iniciar escaneo
        try:
            self.gen = self.lidar.StartScanning()
            self.get_logger().info('Escaneo iniciado correctamente')
        except Exception as e:
            self.get_logger().error(f'Error al iniciar escaneo: {str(e)}')
            self.lidar.Disconnect()
            raise
        
        # Crear timer para publicar datos
        timer_period = 1.0 / scan_freq
        self.timer = self.create_timer(timer_period, self.publish_scan)
        
        self.get_logger().info(f'Nodo YDLidar iniciado - Publicando en /scan a {scan_freq} Hz')
    
    def publish_scan(self):
        try:
            # Obtener una vuelta completa de datos
            data = next(self.gen)
            
            # Crear mensaje LaserScan
            scan_msg = LaserScan()
            scan_msg.header.stamp = self.get_clock().now().to_msg()
            scan_msg.header.frame_id = self.frame_id
            
            # Configuración del LiDAR X4
            scan_msg.angle_min = 0.0  # radianes
            scan_msg.angle_max = 2.0 * math.pi  # 360 grados en radianes
            scan_msg.angle_increment = math.pi / 180.0  # 1 grado en radianes
            scan_msg.time_increment = 0.0  # Desconocido para este modelo
            scan_msg.scan_time = 0.1  # Aproximadamente 10 Hz
            scan_msg.range_min = 0.12  # 12 cm (especificación X4)
            scan_msg.range_max = 10.0  # 10 metros (especificación X4)
            
            # Inicializar array de rangos (360 puntos)
            ranges = [float('inf')] * 360
            intensities = [0.0] * 360
            
            # Llenar datos desde el LiDAR
            for angle_deg in range(360):
                if angle_deg in data:
                    distance = data[angle_deg] / 1000.0  # Convertir mm a metros
                    
                    # Validar rango
                    if scan_msg.range_min <= distance <= scan_msg.range_max:
                        ranges[angle_deg] = distance
                    else:
                        ranges[angle_deg] = float('inf')
                    
                    # Intensidad (si está disponible, sino 0)
                    intensities[angle_deg] = 1.0 if distance > 0 else 0.0
            
            scan_msg.ranges = ranges
            scan_msg.intensities = intensities
            
            # Publicar mensaje
            self.publisher_.publish(scan_msg)
            
            # Log periódico (cada 50 scans)
            if not hasattr(self, 'scan_count'):
                self.scan_count = 0
            self.scan_count += 1
            
            if self.scan_count % 50 == 0:
                valid_points = sum(1 for r in ranges if r != float('inf'))
                self.get_logger().info(
                    f'Scan #{self.scan_count}: {valid_points}/360 puntos válidos'
                )
                
        except StopIteration:
            self.get_logger().warning('StopIteration: Reiniciando escaneo...')
            self.lidar.StopScanning()
            self.gen = self.lidar.StartScanning()
        except Exception as e:
            self.get_logger().error(f'Error en publish_scan: {str(e)}')
    
    def destroy_node(self):
        """Limpieza al cerrar el nodo"""
        try:
            self.get_logger().info('Deteniendo LiDAR...')
            self.lidar.StopScanning()
            self.lidar.Disconnect()
            self.get_logger().info('LiDAR desconectado correctamente')
        except Exception as e:
            self.get_logger().error(f'Error al desconectar: {str(e)}')
        finally:
            super().destroy_node()


def main(args=None):
    rclpy.init(args=args)
    
    try:
        node = YDLidarPublisher()
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f'Error: {e}')
    finally:
        if rclpy.ok():
            node.destroy_node()
            rclpy.shutdown()


if __name__ == '__main__':
    main()
