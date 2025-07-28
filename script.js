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
const loadingEl = document.getElementById("loading");

clearBtn.addEventListener("click", () => {
  resetCanvas();
  document.getElementById("prediction").innerText = "";
  document.getElementById("probabilities").innerHTML = "";
  loadingEl.style.display = "none";
  submitBtn.disabled = false;
});

function renderProbabilities(probs) {
  const container = document.getElementById("probabilities");
  container.innerHTML = "";
  probs.forEach((p, i) => {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.style.margin = "0 2px";

    const percent = document.createElement("span");
    percent.textContent = Math.round(p * 100) + "%";
    percent.style.fontSize = "12px";
    percent.style.marginBottom = "4px";

    const bar = document.createElement("div");
    bar.style.width = "20px";
    bar.style.height = Math.round(p * 100) + "px";
    bar.style.background = "steelblue";
    bar.title = p.toFixed(2);

    const label = document.createElement("span");
    label.textContent = i;
    label.style.fontSize = "12px";
    label.style.marginTop = "4px";

    wrapper.appendChild(percent);
    wrapper.appendChild(bar);
    wrapper.appendChild(label);
    container.appendChild(wrapper);
  });
}

const submitBtn = document.getElementById("submitBtn");
submitBtn.addEventListener("click", async () => {
  loadingEl.style.display = "block";
  submitBtn.disabled = true;

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
    let url = "https://osrspathfinder.com:8443/predict";
    if (false) {
      url = "http://localhost:8443/predict";
    }

    const response = await fetch(url, {
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
    renderProbabilities(result.probabilities);

  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  } finally {
    loadingEl.style.display = "none";
    submitBtn.disabled = false;
  }
});
