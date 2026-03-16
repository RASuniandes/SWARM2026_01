from setuptools import setup

package_name = 'swarm'

setup(
    name=package_name,
    version='0.0.0',
    packages=[package_name],
    data_files=[
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/resource', ['resource/swarm']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='raspi',
    maintainer_email='raspi@todo.todo',
    description='Swarm package',
    license='MIT',
    entry_points={
        'console_scripts': [
            'main = swarm.main:main',
            'aruco_node = swarm.aruco_node:main',
        ],
    },
)

