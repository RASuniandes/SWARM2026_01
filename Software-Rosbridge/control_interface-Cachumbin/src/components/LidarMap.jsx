// src/LidarMap.jsx
import { useState, useEffect } from 'react'
import ROSLIB from 'roslib'

const ros = new ROSLIB.Ros({ url: 'ws://192.168.0.108:9090' })
const scanTopic = new ROSLIB.Topic({
  ros,
  name: '/scan',
  messageType: 'sensor_msgs/LaserScan'
})

export default function LidarMap({
  width = 800,
  height = 800,
  rangeMax = 8.0,
  threshold = 0.4
}) {
  const [points, setPoints] = useState([])

  useEffect(() => {
    scanTopic.subscribe((msg) => {
      const pts = msg.ranges.map((r, i) => {
        const angle = msg.angle_min + i * msg.angle_increment
        return {
          x: r * Math.cos(angle),
          y: r * Math.sin(angle),
          r: r
        }
      }).filter(p => isFinite(p.x) && isFinite(p.y))
      setPoints(pts)
    })
    return () => { scanTopic.unsubscribe() }
  }, [])

  const cx = width / 2
  const cy = height / 2
  const scale = Math.min(width, height) / 2 / rangeMax

  return (
    <svg
      className="lidar-map"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* draw boundary circle */}
      <circle
        cx={cx}
        cy={cy}
        r={scale * rangeMax}
        fill="none"
        stroke="#666"
        strokeWidth="1"
      />
      {points.map((p, i) => {
        const cxp = cx + p.x * scale
        const cyp = cy - p.y * scale
        const isBlocked = p.r < threshold
        return (
          <circle
            key={i}
            cx={cxp}
            cy={cyp}
            r={isBlocked ? 4 : 2}
            className={isBlocked ? 'blocked-point' : 'free-point'}
          />
        )
      })}
    </svg>
  )
}
