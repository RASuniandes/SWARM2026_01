from setuptools import setup
import os
from glob import glob

package_name = 'lidar'

setup(
    name=package_name,
    version='0.0.1',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='raspi',
    maintainer_email='raspi@ubuntu.com',
    description='YDLidar X4 ROS2 Humble Driver',
    license='MIT',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'ydlidar_node = lidar.ydlidar_publisher_node:main',
        ],
    },
)
