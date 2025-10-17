// Leaflet map
const map = L.map('map').setView([48.8566, 2.3522], 13); // Paris par défaut

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let video;
let handpose;
let predictions = [];

let lastX = null;
let lastTime = Date.now();

function detectGesture() {
  if (predictions.length > 0) {
    const x = predictions[0].landmarks[0][0]; // x du poignet
    const now = Date.now();

    if (lastX !== null && now - lastTime > 500) {
      const deltaX = x - lastX;

      if (deltaX > 40) {
        map.panBy([100, 0]); // droite
      } else if (deltaX < -40) {
        map.panBy([-100, 0]); // gauche
      }

      lastTime = now;
    }

    lastX = x;
  }
}

function drawKeypoints(predictions, ctx) {
  predictions.forEach(prediction => {
    const landmarks = prediction.landmarks;
    for (let i = 0; i < landmarks.length; i++) {
      const [x, y] = landmarks[i];
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "aqua";
      ctx.fill();
    }
  });
}

async function setupCamera() {
  video = document.getElementById('video');
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

async function main() {
  await setupCamera();

  const canvas = document.getElementById('output');
  const ctx = canvas.getContext('2d');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  handpose = ml5.handpose(video, () => {
    console.log("Handpose modèle chargé !");
  });

  handpose.on("predict", (results) => {
    predictions = results;
  });

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawKeypoints(predictions, ctx);
    detectGesture();
    requestAnimationFrame(render);
  }

  render();
}

// Attente d’une interaction utilisateur (obligatoire sur iOS)
document.getElementById("start-btn").addEventListener("click", () => {
  document.getElementById("start-overlay").style.display = "none";
  document.querySelector(".container").style.display = "flex";
  main(); // démarrage après clic
});
