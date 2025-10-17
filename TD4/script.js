let map;
let handposeModel;
let predictions = [];

async function setupCamera() {
  const video = document.getElementById('video');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });
    video.srcObject = stream;
    return new Promise(resolve => {
      video.onloadedmetadata = () => resolve(video);
    });
  } catch (err) {
    alert("Erreur d'accès à la caméra : " + err.message);
  }
}

function initMap() {
  map = L.map('map').setView([48.8566, 2.3522], 13); // Paris par défaut
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
}

function drawKeypoints(predictions, ctx) {
  predictions.forEach(prediction => {
    prediction.landmarks.forEach(point => {
      ctx.beginPath();
      ctx.arc(point[0], point[1], 5, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    });
  });
}

function detectGesture(predictions) {
  if (predictions.length > 0) {
    const hand = predictions[0];
    const wrist = hand.landmarks[0];
    const indexTip = hand.landmarks[8];

    const distanceY = Math.abs(indexTip[1] - wrist[1]);

    if (distanceY < 50) {
      map.zoomIn();
    } else if (distanceY > 150) {
      map.zoomOut();
    }
  }
}

async function main() {
  const video = await setupCamera();
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  // Ajuste la taille du canvas à celle de la vidéo
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Charge le modèle Handpose
  handposeModel = ml5.handpose(video, () => {
    console.log("Modèle handpose chargé");
  });

  // Dès qu'une main est détectée
  handposeModel.on("predict", results => {
    predictions = results;
  });

  function renderLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawKeypoints(predictions, ctx);
    detectGesture(predictions);
    requestAnimationFrame(renderLoop);
  }

  renderLoop();
  initMap();
}

// Lance tout une fois que la page est chargée
document.addEventListener("DOMContentLoaded", () => {
  main();
});
