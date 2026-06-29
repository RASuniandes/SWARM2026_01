import json
class Consts:
    serial_port = '/dev/ttyUSB0'
    serial_baudrate = 115200
    serial_timeout = 0.1
    movement_topic = '/movement'
    scan_topic = '/scan'
    feedback_topic = '/esp_feedback'

class Movement:
    def to_json(string: str) -> dict:
        return json.loads(string)
    def format_command(direction: str, speed: int, angle: int) -> str:
        return json.dumps({
            'direction': direction,
            'speed': speed,
            'angle': angle
        }) + '\n'
    valid_directions = ['FORWARD', 'BACKWARD', 'LEFT', 'RIGHT', 'TURN', 'STOP']