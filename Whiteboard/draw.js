const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");
var lastPoint;

var nodes = [];
var isErasing = false; // State for toggling between pen and eraser

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
}

function draw(data) {
  if (data) {
    context.beginPath();
    context.moveTo(data.lastPoint.x, data.lastPoint.y);
    context.lineTo(data.x, data.y);

    if (data.isErasing) {
      context.globalCompositeOperation = "destination-out"; // Erase mode
      context.lineWidth = 20; // Adjust eraser size here
    } else {
      context.globalCompositeOperation = "source-over"; // Pen mode
      context.strokeStyle = data.color;
      context.lineWidth = 5;
    }

    context.lineCap = "round";
    context.stroke();
  }
}

window.onresize = resize;
resize();

function move(e) {
  if (e.buttons) {
    if (!lastPoint) {
      lastPoint = { x: e.offsetX, y: e.offsetY };
      return;
    }

    draw({
      lastPoint,
      x: e.offsetX,
      y: e.offsetY,
      color: color || "green",
      isErasing,
    });

    broadcast(
      JSON.stringify({
        lastPoint,
        x: e.offsetX,
        y: e.offsetY,
        color: color || "green",
        isErasing,
      })
    );

    lastPoint = { x: e.offsetX, y: e.offsetY };
  }
}

function stopDrawing() {
  lastPoint = null; // Reset lastPoint when the mouse is released
}

window.onmousemove = move;
window.onmouseup = stopDrawing;

function key(e) {
  if (e.key === "Backspace") {
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
  }
}

function randomColor() {
  let r = Math.random() * 255;
  let g = Math.random() * 255;
  let b = Math.random() * 255;
  return `rgb(${r}, ${g}, ${b})`;
}

var color = randomColor();

window.onkeydown = key;

const broadcast = (message) => {
  if (!message) return;

  if (!dataChannelOpened) {
    console.error("Data channel is not open yet, queueing message.");
    messageQueue.push(message);
    return;
  }

  var request = {
    textroom: "message",
    transaction: Janus.randomString(12),
    room: parseInt(currentRoomId, 10),
    text: message,
  };

  textroom.data({
    text: JSON.stringify(request),
    success: function () {},
    error: function (error) {
      console.error("Error broadcasting message:", error);
    },
  });
};

async function handleIncomingMessage(msg) {
  if (msg["textroom"] === "message") {
    let data = JSON.parse(msg["text"]);
    draw(data);
  } else {
    console.warn("Unexpected message format:", msg);
  }
}

// Toggle between pen and eraser
function toggleEraser() {
  isErasing = !isErasing;
  if (isErasing) {
    document.getElementById("eraser").textContent = "Drawing";
    console.log("Eraser mode activated");
  } else {
    document.getElementById("eraser").textContent = "Eraser";
    console.log("Pen mode activated");
  }
}

document.getElementById("eraser").addEventListener("click", () => {
  toggleEraser();
});
