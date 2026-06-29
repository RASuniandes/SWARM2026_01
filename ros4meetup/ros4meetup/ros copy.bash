#!/bin/bash
set -e  # Stop if something fails

# (Optional) activate your venv
# source ../venv/bin/activate

source ./install/setup.bash
source ../venv/bin/activate
echo "🚀 Starting ROS 2 nodes in parallel..."
echo "   - autonomous_filter (background"
echo "   - vision_controller (background)"
echo "   - serial_bridge (background)"
echo "   - router (background)"
echo "   - teleop_controller (foreground)"
echo "   - eyes_node (background)"
echo "   - hand_controller (background)"
# Background processes (log output to files)
ros2 run ros4meetup eyes_node         > eyes.log   2>&1 &
ros2 run ros4meetup autonomous_filter > filter.log 2>&1 &
ros2 run ros4meetup vision_controller > vision.log 2>&1 &
ros2 run ros4meetup serial_bridge     > serial.log 2>&1 &
ros2 run ros4meetup router            > router.log 2>&1 &
ros2 run ros4meetup hand_controller   > hand.log   2>&1 &

# Foreground process (interactive)
ros2 run ros4meetup teleop_controller

# When teleop_controller exits, kill everything else
echo "🛑 teleop_controller exited, stopping all other nodes..."
pkill -f "ros2 run ros4meetup" || true

echo "✅ All nodes stopped cleanly."
