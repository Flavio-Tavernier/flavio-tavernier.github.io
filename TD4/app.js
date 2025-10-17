// Initialisation Leaflet
const map = L.map('map').setView([48.8566, 2.3522], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Variables globales
let video;
let handpose;
let predictions = [];

let lastX = null;
let lastTime = Date.now();
let isPalmOpen = false;

// Détection de geste gauche/droite
function detectSwipeGesture() {
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

// Détection de paume ouverte (méthode simple basée sur distance doigts-poignet)
function detectOpenPalm(hand) {
  const wrist = hand.landmarks[0];
  const tips = [8, 12, 16, 20]; // extrémités des 4 doigts
  let extendedFingers = 0;

  tips.forEach(tipIndex => {
    const tip = hand.landmarks[tipIndex];
    const distance = Math.hypot(tip[0] - wrist[0], tip[1] - wrist[1]);

    if (distance > 100) { // seuil empirique, à ajuster selon la distance caméra
      extendedFingers++;
    }
  });

  return extendedFingers >= 4;
}

// Affichage des points + message si paume détectée
function drawAnnotations(predictions, ctx) {
  predictions.forEach(prediction => {
    const landmarks = prediction.landmarks;

    // Dessine les points
    for (let i = 0; i < landmarks.length; i++) {
      const [x, y] = landmarks[i];
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "aqua";
      ctx.fill();
    }

    // Détection paume ouverte
    if (detectOpenPalm(prediction)) {
      isPalmOpen = true;
      ctx.font = "30px Arial";
      ctx.fillStyle = "lime";
      ctx.fillText("Paume détectée", 30, 50);
    } else {
      isPalmOpen = false;
    }
  });
}

// Accès à la caméra
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

// Main app
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
    drawAnnotations(predictions, ctx);
    detectSwipeGesture();
    requestAnimationFrame(render);
  }

  render();
}

// Démarrage après clic (iOS compatible)
document.getElementById("start-btn").addEventListener("click", () => {
  document.getElementById("start-overlay").style.display = "none";
  document.querySelector(".container").style.display = "flex";

  setTimeout(() => {
    map.invalidateSize();
  }, 100);

  main();
});
