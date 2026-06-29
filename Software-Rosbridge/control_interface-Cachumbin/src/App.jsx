import { useEffect, useRef } from 'react'
import ROSLIB from 'roslib'
import './App.css'
import MovementControls from './components/MovementControls'
import LidarMap from './components/LidarMap'

const ros = new ROSLIB.Ros({ url: 'ws://192.168.0.1:9090' })
const movementTopic = new ROSLIB.Topic({
  ros,
  name: '/movement',
  messageType: 'std_msgs/String'
})

function App() {
  const intervalRef = useRef(null)

  const sendDir = (dir) => {
    movementTopic.publish({ data: dir })
  }

  const startSending = (dir) => {
    if (intervalRef.current) return
    sendDir(dir)
    intervalRef.current = setInterval(() => sendDir(dir), 200)
  }

  const stopSending = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      const k = e.key.toUpperCase()
      if (['W','A','S','D'].includes(k)) {
        e.preventDefault()
        startSending(k)
      }
    }
    const onKeyUp = (e) => {
      if (['W','A','S','D'].includes(e.key.toUpperCase())) {
        e.preventDefault()
        stopSending()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      stopSending()
    }
  }, [])

  return (
    <div className="App">
      <h1>Move with arrows or WASD</h1>
      <MovementControls
        startSending={startSending}
        stopSending={stopSending}
      />
      <h2>LIDAR Scan View</h2>
      <LidarMap width={650} height={650} rangeMax={8.0} threshold={0.4} />    </div>
  )
}

export default App
