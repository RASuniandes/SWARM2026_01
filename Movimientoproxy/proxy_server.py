#!/usr/bin/env python3
"""
proxy_server.py

Sits between the website and rosbridge.
- Listens for WebSocket connections from the browser on port 8765
- Translates { action: "forward" } into a ROS Twist message
- Forwards it to rosbridge on port 9090

Run:
    python3 proxy_server.py

Requires:
    pip install websockets --break-system-packages
"""

import asyncio
import json
import websockets

# ── Rosbridge address ──
ROSBRIDGE_URL = 'ws://localhost:9090'

# ── Proxy listens on this port ──
PROXY_PORT = 8765

# ── Speed settings (edit these to change robot speed) ──
LINEAR_SPEED  = 0.2   # m/s
ANGULAR_SPEED = 0.5   # rad/s

# ── Twist values for each action ──
# Format: (linear_x, angular_z)
COMMANDS = {
    'forward':       ( LINEAR_SPEED,  0.0),
    'back':          (-LINEAR_SPEED,  0.0),
    'left':          ( 0.0,           ANGULAR_SPEED),
    'right':         ( 0.0,          -ANGULAR_SPEED),
    'forward_left':  ( LINEAR_SPEED,  ANGULAR_SPEED),
    'forward_right': ( LINEAR_SPEED, -ANGULAR_SPEED),
    'back_left':     (-LINEAR_SPEED,  ANGULAR_SPEED),
    'back_right':    (-LINEAR_SPEED, -ANGULAR_SPEED),
    'stop':          ( 0.0,           0.0),
}

def build_twist_msg(linear_x, angular_z):
    """Build a rosbridge-formatted Twist message."""
    return json.dumps({
        "op": "publish",
        "topic": "/cmd_vel",
        "msg": {
            "linear":  {"x": linear_x, "y": 0.0, "z": 0.0},
            "angular": {"x": 0.0,      "y": 0.0, "z": angular_z}
        }
    })

def build_advertise_msg():
    """Tell rosbridge we want to publish on /cmd_vel."""
    return json.dumps({
        "op": "advertise",
        "topic": "/cmd_vel",
        "type": "geometry_msgs/Twist"
    })

async def handle_browser(websocket):
    """Handle one browser connection."""
    print(f"[proxy] Browser connected: {websocket.remote_address}")

    # Connect to rosbridge
    try:
        async with websockets.connect(ROSBRIDGE_URL) as ros_ws:
            print(f"[proxy] Connected to rosbridge at {ROSBRIDGE_URL}")

            # Advertise /cmd_vel to rosbridge
            await ros_ws.send(build_advertise_msg())
            print("[proxy] Advertised /cmd_vel")

            # Listen for commands from browser
            async for message in websocket:
                try:
                    data = json.loads(message)
                    action = data.get('action', 'stop')
                    print(f"[proxy] Received action: {action}")

                    if action in COMMANDS:
                        lin, ang = COMMANDS[action]
                        twist = build_twist_msg(lin, ang)
                        await ros_ws.send(twist)
                        print(f"[proxy] Sent to ROS: linear={lin}, angular={ang}")
                    else:
                        print(f"[proxy] Unknown action: {action}")

                except json.JSONDecodeError:
                    print(f"[proxy] Bad message: {message}")

    except Exception as e:
        print(f"[proxy] Could not connect to rosbridge: {e}")
        print(f"[proxy] Make sure rosbridge is running:")
        print(f"[proxy]   ros2 launch rosbridge_server rosbridge_websocket_launch.xml")

    print(f"[proxy] Browser disconnected")

async def main():
    print(f"[proxy] Starting proxy server on ws://localhost:{PROXY_PORT}")
    print(f"[proxy] Forwarding to rosbridge at {ROSBRIDGE_URL}")
    print(f"[proxy] Open your Website_Movimiento.html in a browser")
    print(f"[proxy] Press Ctrl+C to stop")

    async with websockets.serve(handle_browser, 'localhost', PROXY_PORT):
        await asyncio.Future()  # run forever

if __name__ == '__main__':
    asyncio.run(main())
