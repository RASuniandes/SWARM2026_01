import './lidarView.css'
import ROSLIB from 'roslib'
import ReturnButton from '../../components/returnButton'
import { useEffect, useRef, useState } from 'react'


export default function LidarView() {
  const radarRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('Connecting...')
  const [scanTopic, setScanTopic] = useState<ROSLIB.Topic | null>(null)
  useEffect(() => {
    console.log('Connecting to ROS...')
    const ros = new ROSLIB.Ros({ url: 'ws://192.168.0.108:9090' })
    const scanTopic = new ROSLIB.Topic({
      ros,
      name: '/scan',
      messageType: 'sensor_msgs/LaserScan'
    })
    // Manejo de eventos de conexión
    ros.on('connection', () => {
      setStatus('✅ Connected to ROS')
    })
    ros.on('error', () => {
      setStatus('❌ Connection error')
    })
    ros.on('close', () => {
      setStatus('🔌 Disconnected')
    })
    setScanTopic(scanTopic)

  }, [])
  useEffect(() => {


    const interval = setInterval(() => {
      const angle = Math.random() * 360
      const radius = Math.random() * 100
      const [x, y] = distanceAngleToXY(radius, angle)
      addPoint(x, y)
    }, 10)

    return () => {
      clearInterval(interval)
    }
  }, [])
  // Use effect to subscribe to scan topic
  useEffect(() => {
    if (!scanTopic) return

    scanTopic.subscribe((msg) => {
      interface LaserScanMsg {
        ranges: number[]
        angle_min: number
        angle_increment: number
      }

      interface Point {
        angle: number
        r: number
      }

      const msgTyped = msg as LaserScanMsg
      const pts: Point[] = msgTyped.ranges.map((r: number, i: number) => {
        console.log('R:', r)
        const angle = msgTyped.angle_min + i * msgTyped.angle_increment
        return {
          angle: angle * 180 / Math.PI,
          r: r
        }
      }).filter((p: Point) => isFinite(p.angle) && isFinite(p.r))
      pts.forEach(({ angle, r }) => {
        const [px, py] = distanceAngleToXY(r, angle)
        addPoint(px, py)
      })
    })
    return () => { scanTopic.unsubscribe() }
  }, [scanTopic])
  // Example points
  // useEffect(() => {
  //   const bigRadar = radarRef.current
  //   if (!bigRadar) return

  //   // Example points
  //   const interval = setInterval(() => {
  //     const angle = Math.random() * 360
  //     const radius = Math.random() * 100
  //     const [x, y] = distanceAngleToXY(radius, angle)
  //     addPoint(x, y)
  //   }, 10)

  //   // Cleanup
  //   return () => {
  //     clearInterval(interval)
  //   }
  // }, [])
  // Add point function
  function addPoint(x: number, y: number) {
      const bigRadar = radarRef.current
      if (!bigRadar) return
      const point = document.createElement('div')

      point.style.left = `${x}%`
      point.style.top = `${y}%`
      point.classList.add('radarPoint')
      bigRadar.appendChild(point)
      setTimeout(() => {
        point.style.opacity = '0'
      }, 1000)
      setTimeout(() => {
        point.remove()
      }, 1500)
      return point
    }
  // Convert distance/angle to XY
  function distanceAngleToXY(distance: number, angle: number, origin: [number, number] = [50, 50]) {
    // Distance -> 0-100
    // Angle -> Degrees
    angle = -angle * Math.PI / 180
      distance = distance * 0.5
      const x = origin[0] + distance * Math.cos(angle)
      const y = origin[1] + distance * Math.sin(angle)
      return [x, y]
  }
  return (
    <>
      <ReturnButton /> 
      <h1 style={{color: status.includes('error') ? 'red' : 'green'}}>{status}</h1>
      <div className="originPoint"/>
      <div className="bigRadar" ref={radarRef}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="circleLayer" style={{
            transform: `scale(${1 - i * 0.1})`,
            borderWidth: `${2 + i * 0.5}px`
          }} />
        ))}
      </div>
    </>
  )
}
