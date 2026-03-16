#include "rclcpp/rclcpp.hpp"
#include "sensor_msgs/msg/point_cloud2.hpp"
#include "std_msgs/msg/header.hpp"

// Include YDLidar SDK headers
#include "ydlidar_sdk/ydlidar_driver.h"

class YdlidarNode : public rclcpp::Node
{
public:
    YdlidarNode() : Node("ydlidar_node")
    {
        // Create publisher
        point_cloud_publisher_ = this->create_publisher<sensor_msgs::msg::PointCloud2>("/cloud", 10);

        // Create YDLidar SDK object
        lidar_driver_.init("/dev/ttyUSB0", 115200); // Adjust the port if necessary
        lidar_driver_.connect();

        // Start the timer for fetching lidar data
        timer_ = this->create_wall_timer(
            std::chrono::milliseconds(100),
            std::bind(&YdlidarNode::publishLidarData, this)
        );
    }

private:
    void publishLidarData()
    {
        // Request a scan from the YDLidar
        YDLidarScan scan = lidar_driver_.getScanData();
        if (scan.success)
        {
            // Prepare PointCloud2 message
            sensor_msgs::msg::PointCloud2 point_cloud_msg;
            point_cloud_msg.header.stamp = this->get_clock()->now();
            point_cloud_msg.header.frame_id = "base_link";  // Set appropriate frame_id

            // Convert scan data into point cloud format
            point_cloud_msg.data.clear();
            for (auto& point : scan.points)
            {
                point_cloud_msg.data.push_back(point.x);
                point_cloud_msg.data.push_back(point.y);
                point_cloud_msg.data.push_back(point.z);
            }

            // Publish point cloud message
            point_cloud_publisher_->publish(point_cloud_msg);
        }
    }

    rclcpp::Publisher<sensor_msgs::msg::PointCloud2>::SharedPtr point_cloud_publisher_;
    YDLidarDriver lidar_driver_;  // YDLidar SDK driver object
    rclcpp::TimerBase::SharedPtr timer_;
};

int main(int argc, char** argv)
{
    rclcpp::init(argc, argv);
    rclcpp::spin(std::make_shared<YdlidarNode>());
    rclcpp::shutdown();
    return 0;
}
