from setuptools import setup
import os
from glob import glob
package_name = 'ros4meetup'
setup(
    name=package_name,
    version='0.0.1',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages',
         ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        (os.path.join('share', package_name, 'launch'), glob('launch/*.py')),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='ivan',
    maintainer_email='ivandavidgomezsilva@hotmail.com',
    description='Controller bridge and mode router for ESP32-based robot with ROS2',
    license='MIT',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'router = ros4meetup.router:main',
            'serial_bridge = ros4meetup.serial_bridge:main',
            'teleop_controller = ros4meetup.teleop_controller:main',
            'vision_controller = ros4meetup.vision_controller:main',
            'autonomous_controller = ros4meetup.autonomous_controller:main',
            'ydlidar_node = ros4meetup.ydlidar_publisher_node:main',
            'hand_controller = ros4meetup.hand_controller:main',
        ],
    },
)
