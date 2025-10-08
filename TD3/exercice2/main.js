// index.js

import * as THREE from 'three';

// Setup caméra vidéo
async function setupCameraVideo() {
  const video = document.createElement('video');
  video.style.position = 'fixed';
  video.style.top = '0';
  video.style.left = '0';
  video.style.width = '100vw';
  video.style.height = '100vh';
  video.style.objectFit = 'cover';
  video.style.zIndex = '-1'; // Derrière tout
  video.autoplay = true;
  video.playsInline = true; // important pour iPhone
  document.body.appendChild(video);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = stream;
  } catch (err) {
    alert('Erreur accès caméra : ' + err.message);
  }
}

// Setup carte Leaflet
function setupMap() {
  const mapDiv = document.createElement('div');
  mapDiv.id = 'map';
  mapDiv.style.position = 'fixed';
  mapDiv.style.bottom = '10px';
  mapDiv.style.left = '10px';
  mapDiv.style.width = '150px';
  mapDiv.style.height = '150px';
  mapDiv.style.zIndex = '1000';
  mapDiv.style.border = '2px solid white';
  document.body.appendChild(mapDiv);

  const map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
  }).setView([0, 0], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  }).addTo(map);

  return map;
}

// Setup Three.js scène en overlay
function setupThree() {
  const threeCanvas = document.createElement('canvas');
  threeCanvas.style.position = 'fixed';
  threeCanvas.style.top = '0';
  threeCanvas.style.left = '0';
  threeCanvas.style.width = '100vw';
  threeCanvas.style.height = '100vh';
  threeCanvas.style.pointerEvents = 'none'; // click à travers
  threeCanvas.style.zIndex = '10';

  document.body.appendChild(threeCanvas);

  const renderer = new THREE.WebGLRenderer({ canvas: threeCanvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 0);

  // Lumière simple
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, 10, 10);
  scene.add(light);

  return { renderer, scene, camera };
}

// Conversion approximative de lat/lon en coordonnées 3D locales
// (en mètres, par rapport au point de référence)
function latLonToMeters(latRef, lonRef, lat, lon) {
  const earthRadius = 6378137; // en mètres
  const dLat = THREE.MathUtils.degToRad(lat - latRef);
  const dLon = THREE.MathUtils.degToRad(lon - lonRef);

  const x = earthRadius * dLon * Math.cos(THREE.MathUtils.degToRad(latRef));
  const z = earthRadius * dLat;

  return new THREE.Vector3(x, 0, z);
}

async function main() {
  await setupCameraVideo();

  const map = setupMap();
  const { renderer, scene, camera } = setupThree();

  let userLat = 0;
  let userLon = 0;
  let userHeading = 0;

  // Point de référence = position utilisateur initiale
  let refSet = false;
  let latRef = 0;
  let lonRef = 0;

  // Géolocalisation en temps réel
  navigator.geolocation.watchPosition(pos => {
    userLat = pos.coords.latitude;
    userLon = pos.coords.longitude;

    if (!refSet) {
      latRef = userLat;
      lonRef = userLon;
      map.setView([latRef, lonRef], 18);
      refSet = true;
    }

    // Mise à jour carte
    map.setView([userLat, userLon]);

  }, err => {
    console.error('Erreur géoloc:', err);
  }, {
    enableHighAccuracy: true,
    maximumAge: 1000
  });

  // Orientation smartphone (alpha = rotation autour axe Z)
  window.addEventListener('deviceorientationabsolute', e => {
    if (e.absolute === true && e.alpha !== null) {
      userHeading = e.alpha; // degré 0-360
    }
  });

  // Objet géolocalisé 3D à afficher (ex: cube)
  // On va créer un cube à 5 mètres au nord du point de référence
  const objGeoLat = latRef + 0.000045; // approx 5m au nord (0.000009 = ~1m)
  const objGeoLon = lonRef;

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Update loop Three.js
  function animate() {
    requestAnimationFrame(animate);

    if (refSet) {
      // Calcul position relative du cube par rapport à l'utilisateur
      const pos = latLonToMeters(latRef, lonRef, objGeoLat, objGeoLon);

      // Rotation de la caméra selon orientation smartphone
      const headingRad = THREE.MathUtils.degToRad(userHeading);

      // Position de la caméra au centre (0,0,0)
      camera.position.set(0, 0, 0);
      camera.rotation.set(0, 0, 0);

      // On fait tourner la scène opposé à la direction pour simuler rotation
      scene.rotation.y = -headingRad;

      // Placer le cube
      cube.position.set(pos.x, 0, pos.z);
    }

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
  });
}

main();
