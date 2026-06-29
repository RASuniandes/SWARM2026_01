// ── Connect to your proxy server ──
const socket = new WebSocket('ws://localhost:8765');

socket.onopen = function() {
  console.log('Connected to proxy server');
};

socket.onerror = function(e) {
  console.error('WebSocket error:', e);
};

socket.onclose = function() {
  console.log('Disconnected from proxy');
};

// ── Helper: send action to proxy ──
function sendCommand(action) {
  if (socket.readyState === WebSocket.OPEN) {
    const msg = JSON.stringify({ action: action });
    socket.send(msg);
    console.log('Sent:', action);
  } else {
    console.warn('Not connected to proxy');
  }
}


document.getElementById('msgButton1').addEventListener('click', function() {
  sendCommand('forward_left');
});

document.getElementById('msgButton2').addEventListener('click', function() {
  sendCommand('forward');
});

document.getElementById('msgButton3').addEventListener('click', function() {
  sendCommand('forward_right');
});

document.getElementById('msgButton4').addEventListener('click', function() {
  sendCommand('left');
});

document.getElementById('msgButton5').addEventListener('click', function() {
  sendCommand('stop');
});

document.getElementById('msgButton6').addEventListener('click', function() {
  sendCommand('right');
});

document.getElementById('msgButton7').addEventListener('click', function() {
  sendCommand('back_left');
});

document.getElementById('msgButton8').addEventListener('click', function() {
  sendCommand('back');
});

document.getElementById('msgButton9').addEventListener('click', function() {
  sendCommand('back_right');
});
