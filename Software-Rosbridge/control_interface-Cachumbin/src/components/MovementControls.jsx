import React from 'react'

export default function MovementControls({ startSending, stopSending }) {
  return (
    <div className="controls">
      <div
        className="arrow arrow-up"
        onMouseDown={() => startSending('W')}
        onMouseUp={stopSending}
        onMouseLeave={stopSending}
      />
      <div
        className="arrow arrow-left"
        onMouseDown={() => startSending('A')}
        onMouseUp={stopSending}
        onMouseLeave={stopSending}
      />
      <div
        className="arrow arrow-down"
        onMouseDown={() => startSending('S')}
        onMouseUp={stopSending}
        onMouseLeave={stopSending}
      />
      <div
        className="arrow arrow-right"
        onMouseDown={() => startSending('D')}
        onMouseUp={stopSending}
        onMouseLeave={stopSending}
      />
    </div>
  )
}
