import { useMemo, useState } from "react";
import ReturnButton from "../../components/returnButton";
import ROSLIB from "roslib";
import './controller.css'
const ros = new ROSLIB.Ros({ url: 'ws://192.168.0.108:9090' })
const movementTopic = new ROSLIB.Topic({
  ros,
  name: '/movement',
  messageType: 'std_msgs/String'
})
const keyToIndex: Record<string, number> = {
  ArrowUp: 1,
  ArrowLeft: 3,
  ArrowRight: 5,
  ArrowDown: 7,
};
export default function ControllerView() {
  const [speed, setSpeed] = useState(0);
  const [angle, setAngle] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const buttons = useMemo(() => [
    null,
    { name: "Forward", command: "forward", icon: "▲" },
    null,
    { name: "Left", command: "left", icon: "◀" },
    { name: "Turn", command: "turn", icon: "↻" },
    { name: "Right", command: "right", icon: "▶" },
    null,
    { name: "Backward", command: "backward", icon: "▼" },
    null,
  ], []);

  async function sendCommand(index: number | string) {
    let direction = "";
    let idx: number | null = null;
    if (typeof index === "string") {
      direction = index;
      idx = keyToIndex[index];
    } else {
      if (buttons[index] === null) return;
      direction = buttons[index].name;
      idx = index;
    }
    setActiveIndex(idx);

    const body = {
      "speed": speed,
      "direction": direction,
      "angle": angle
    }
    movementTopic.publish(body);

    // Remove active class after 200ms
    setTimeout(() => setActiveIndex(null), 200);
  }


  function keyDownCallback(event: React.KeyboardEvent<HTMLDivElement>) {
    if (keyToIndex[event.key] !== undefined) {
      sendCommand(event.key);
    }
  }

  function handleButtonClick(index: number) {
    sendCommand(index);
  }

  return (
    <>
      <ReturnButton />
      <div className="container">
        <h1>Controller View</h1>
        <div className="split">
          Speed: {speed}
          <input type="range" min="0" max="100" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
        </div>
        <div className="turn">
          Angle: {angle}
          <input type="range" min="0" max="360" value={angle} onChange={(e) => setAngle(Number(e.target.value))} />
        </div>
        <div className="controllerGrid" onKeyDown={keyDownCallback} tabIndex={0}>
          {buttons.map((button, index) => {
            if (button === null) {
              return <div key={index} className="empty"></div>
            }
            return (
              <div
                key={index}
                onClick={() => handleButtonClick(index)}
                className={activeIndex === index ? "active controllerButton" : "controllerButton"}
              >
                {button.icon}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
