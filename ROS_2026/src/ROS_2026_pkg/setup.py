from setuptools import find_packages, setup

package_name = 'ROS_2026_pkg'

setup(
    name=package_name,
    version='0.0.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name, ['launch/*.py']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='ivandagomez',
    maintainer_email='ivandavidgomezsilva@hotmail.com',
    description='TODO: Package description',
    license='TODO: License declaration',
    extras_require={
        'test': [
            'pytest',
        ],
    },
    entry_points={
        'console_scripts': [
                'teleop_gazebo = ROS_2026_pkg.teleop_gazebo:main',
                'teleop_controller = ROS_2026_pkg.teleop_controller:main',
                'vision_controller = ROS_2026_pkg.vision_controller:main',
                'hand_controller = ROS_2026_pkg.hand_controller:main'
        ],
    },
)
