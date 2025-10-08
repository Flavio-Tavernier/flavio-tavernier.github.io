import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet-src.esm.js';

async function setupCameraVideo() {
  const video = document.getElementById('camvideo');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = stream;
  } catch (err) {
    alert('Erreur accès caméra : ' + err.message);
  }
}

function setupMap() {
  const map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  return map;
}

function setupThree() {
  const canvas = document.createElement('canvas');
  canvas.id = 'three-canvas';
  document.body.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 0);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, 10, 10);
  scene.add(light);

  return { renderer, scene, camera };
}

// Convert lat/lon difference to meters in local flat coords (x East, z North)
function latLonToMeters(latRef, lonRef, lat, lon) {
  const earthRadius = 6378137; // meters
  const dLat = THREE.MathUtils.degToRad(lat - latRef);
  const dLon = THREE.MathUtils.degToRad(lon - lonRef);

  const x = earthRadius * dLon * Math.cos(THREE.MathUtils.degToRad(latRef));
  const z = earthRadius * dLat;

  return new THREE.Vector3(x, 0, z);
}

async function requestGeolocationPermission() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Géolocalisation non supportée'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos),
      err => reject(err),
      { enableHighAccuracy: true }
    );
  });
}

async function main() {
  const coordsDiv = document.getElementById('coords');

  await setupCameraVideo();

  let userLat = 0;
  let userLon = 0;
  let userHeading = 0;

  let refSet = false;
  let latRef = 0;
  let lonRef = 0;

  try {
    const pos = await requestGeolocationPermission();
    userLat = pos.coords.latitude;
    userLon = pos.coords.longitude;
    latRef = userLat;
    lonRef = userLon;
    refSet = true;

    coordsDiv.textContent = `Position GPS initiale : ${latRef.toFixed(6)}, ${lonRef.toFixed(6)}`;
  } catch (e) {
    alert('Erreur ou refus permission géolocalisation : ' + e.message);
    coordsDiv.textContent = 'Erreur géolocalisation';
    return;
  }

  const map = setupMap();
  map.setView([latRef, lonRef], 18);

  const { renderer, scene, camera } = setupThree();

  // Cube 3D rouge
  const geometry = new THREE.BoxGeometry(1,1,1);
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Position cube à environ 5m au nord du point de référence
  const objGeoLatOffset = 0.000045; // ~5m en latitude
  let objGeoLat = latRef + objGeoLatOffset;
  let objGeoLon = lonRef;

  const frustum = new THREE.Frustum();
  const cameraViewProjectionMatrix = new THREE.Matrix4();

  // Orientation absolue (alpha = rotation autour Z)
  window.addEventListener('deviceorientationabsolute', (e) => {
    if (e.absolute === true && e.alpha !== null) {
      userHeading = e.alpha;
    }
  });

  navigator.geolocation.watchPosition(pos => {
    userLat = pos.coords.latitude;
    userLon = pos.coords.longitude;

    if (!refSet) {
      latRef = userLat;
      lonRef = userLon;
      map.setView([latRef, lonRef], 18);
      refSet = true;
    }

    coordsDiv.textContent = `Position GPS : ${userLat.toFixed(6)}, ${userLon.toFixed(6)}`;
    map.setView([userLat, userLon]);
  }, err => {
    console.error('Erreur géoloc:', err);
    coordsDiv.textContent = 'Erreur géolocalisation';
  }, {
    enableHighAccuracy: true,
    maximumAge: 1000
  });

  function animate() {
    requestAnimationFrame(animate);

    if (refSet) {
      objGeoLat = latRef + objGeoLatOffset;
      objGeoLon = lonRef;

      const pos = latLonToMeters(latRef, lonRef, objGeoLat, objGeoLon);

      const headingRad = THREE.MathUtils.degToRad(userHeading);

      camera.position.set(0, 0, 0);
      camera.rotation.set(0, 0, 0);

      // On fait tourner la scène inverse à l’orientation pour simuler la direction regardée
      scene.rotation.y = -headingRad;

      cube.position.set(pos.x, 0, pos.z);

      camera.updateMatrix();
      camera.updateMatrixWorld();
      camera.matrixWorldInverse.getInverse(camera.matrixWorld);

      cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);

      cube.visible = frustum.containsPoint(cube.position);
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