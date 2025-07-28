const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resetCanvas() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

resetCanvas();

ctx.lineWidth = 10;
ctx.lineCap = "round";
ctx.strokeStyle = "white";

let drawing = false;
let lastX = 0;
let lastY = 0;

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.touches ? e.touches[0].clientX : e.clientX) - rect.left,
    y: (e.touches ? e.touches[0].clientY : e.clientY) - rect.top,
  };
}

function startDrawing(e) {
  drawing = true;
  const pos = getPos(e);
  lastX = pos.x;
  lastY = pos.y;
  e.preventDefault();
}

function draw(e) {
  if (!drawing) return;
  const pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  lastX = pos.x;
  lastY = pos.y;
  e.preventDefault();
}

function stopDrawing() {
  drawing = false;
}

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

const clearBtn = document.getElementById("clearBtn");
clearBtn.addEventListener("click", () => {
  resetCanvas();
  document.getElementById("prediction").innerText = "";
});

const submitBtn = document.getElementById("submitBtn");
submitBtn.addEventListener("click", async () => {
  const smallCanvas = document.createElement("canvas");
  smallCanvas.width = 28;
  smallCanvas.height = 28;
  const sctx = smallCanvas.getContext("2d");

  sctx.drawImage(canvas, 0, 0, 28, 28);

  const imgData = sctx.getImageData(0, 0, 28, 28).data;
  const pixels = [];

  for (let i = 0; i < imgData.length; i += 4) {
    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];

    const gray = (r + g + b) / 3 / 255;
    pixels.push(gray);
  }

  try {
    const response = await fetch("http://osrspathfinder.com:8080/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: pixels }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Prediction failed");
    }

    const result = await response.json();
    document.getElementById("prediction").innerText =
      "Prediction: " + result.prediction;
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
});
