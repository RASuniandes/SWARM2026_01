# SWARM 2026-2 Software Documentation

## 1. Overall System Architecture
The software implementation is designed to be modular and scalable. It utilizes a web-based interface integrated with AWS Lambda/Firebase functions for fleet management. The robots maintain local autonomy, receiving high-level instructions from the cloud.

### Communication Flow
* **Cloud-to-Robot:** Instructions sent via secure socket/API to the robot’s custom bridge.
* **Map Management:** Maps are sent periodically or on-demand from the robot to the cloud to optimize bandwidth and cloud storage costs.

---

## 2. Node Specifications

### A. Operational Nodes (Lifecycle Enabled)
These nodes output velocity commands to the `Router`.

| Node | Topic (Output) | Primary Parameters |
| :--- | :--- | :--- |
| **Teleop Node** | `/cmd_teleop` | `linear_speed`, `angular_speed` |
| **Hand Node** | `/cmd_hand` | `sensitivity`, `gesture_map` |
| **Vision Node** | `/cmd_vision` | `sensitivity`, `cue_map` |
| **Autonomous Node** | `/cmd_nav` | `max_vel`, `max_accel`, `mission_map` |
(Will be a router_listener topic for the router to send the nodes which node he is listening to: `/router_listener`)
### B. Core Controller Nodes
| Node | Name/Type | Purpose/Interface |
| :--- | :--- | :--- |
| **Router** | `router_node` | Arbitration node. **Param:** `current_mode`. **Action:** `switch_mode`. |
| **Serial Bridge** | `bridge_node` | **Topic (Sub):** `/cmd_vel` (final), `/lift_cmd`. **Interface:** Serial to ESP. |
| **Lift Controller**| `lift_node` | **Action:** `move_lift`. **Params:** `max_height`, `speed`, `limit_safety`. |

### C. Perception & Infrastructure Nodes
| Node | Topic (Output) | Purpose |
| :--- | :--- | :--- |
| **Odom Listener** | `/odom` | Publishes encoder/IMU feedback from ESP. |
| **Lidar Listener** | `/scan` | Raw data ingestion to ROS 2. |
| **SLAM Toolbox** | `/map`, `/map_metadata` | Simultaneous Localization and Mapping. |

### D. Monitoring Nodes
| Node | Topic (Output) | Responsibility |
| :--- | :--- | :--- |
| **Health Monitor** | `/status/hardware` | Battery, sensor status, actuator errors. |
| **Node Health** | `/status/nodes` | Heartbeat, resource usage (CPU/RAM), availability. |

---

## 3. Communication Interface Details

### Custom WebSocket/API Bridge
Since standard `rosbridge` is omitted for security, this custom node performs:
1. **Serialization:** Implementation of Protobuf for binary message efficiency.
2. **Security:** mTLS handshake between the AWS/Firebase endpoint and the local bridge node.
3. **Map Throttling:** Logic to transmit map updates only when the `map_change_threshold` is exceeded to keep the bill low.

### ESP-to-Robot PWM Logic
The ESP32 acts as an isolated hardware controller:
* **Input:** Receives structured serial packets from `Serial Bridge`.
* **Output:** Local PWM generation for motors and lift actuators.
* **Safety:** If serial connection heartbeat is lost (Timeout: 50ms), the ESP enters a "Safe Halt" state independently of the ROS 2 network.

---

## 4. Configuration & Lifecycle Management (`launch.py`)

The `launch.py` file serves as the centralized orchestrator.

* **Lifecycle Sequence:**
    1.  **Hardware Drivers:** `Serial Bridge`, `Lidar Listener`.
    2.  **Navigation/Mapping:** `SLAM Toolbox`, `Map Server`.
    3.  **Core Logic:** `Router`, `Mission Controller`.
    4.  **Operational Nodes:** `Teleop`, `Vision`, etc.
* **Orchestration:** Each node is defined as a `LifecycleNode`. The launch file monitors the transition from `Unconfigured` -> `Inactive` -> `Active`.
* **Visualization:** Includes standard configuration for `rviz2` to visualize `/map`, `/odom`, and `/cmd_vel` paths.

---

## 5. Implementation Logic Checklist
* [ ] **Router Arbitration:** Ensure "Autonomous" mode is preempted if "Teleop" node sends a command.
* [ ] **Map Management:** Implement a service call `update_map` that triggers only when the robot's exploration status changes significantly.
* [ ] **Lifecycle States:** Ensure all nodes are configured to handle `on_shutdown` gracefully to prevent hardware from locking in a powered state.