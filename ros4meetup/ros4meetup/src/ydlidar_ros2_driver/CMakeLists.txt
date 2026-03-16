cmake_minimum_required(VERSION 3.5)
project(ydlidar_ros2_driver)

find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(sensor_msgs REQUIRED)
find_package(std_msgs REQUIRED)

# Add path to the YDLidar SDK headers and libraries
include_directories(/../YDLidar-SDK/core)

add_executable(ydlidar_driver src/ydlidar_driver.cpp)

# Link the YDLidar SDK library correctly
target_link_libraries(ydlidar_driver
  /../YDLidar-SDK/build/lib/libydlidar_sdk.a)  # Adjust the path to the SDK library

ament_target_dependencies(ydlidar_driver rclcpp sensor_msgs std_msgs)

install(TARGETS ydlidar_driver DESTINATION lib/ros4meetup)

ament_package()
