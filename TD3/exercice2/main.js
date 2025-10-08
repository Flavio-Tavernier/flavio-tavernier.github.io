import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js'; 
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet-src.esm.js';

async function setupCameraVideo() {
  const video = document.getElementById('camvideo');
  if (!video) {
    alert("Élément vidéo introuvable dans le DOM (id='camvideo')");
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = stream;
    await video.play();
    return true;
  } catch (err) {
    alert('Erreur accès caméra : ' + err.message);
    return false;
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

async function requestOrientationPermission() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const response = await DeviceOrientationEvent.requestPermission();
      if (response === 'granted') {
        return true;
      } else {
        alert("Permission orientation refusée");
        return false;
      }
    } catch (err) {
      alert("Erreur demande permission orientation: " + err);
      return false;
    }
  } else {
    // Pas besoin de permission
    return true;
  }
}

window.onload = () => {
  const coordsDiv = document.getElementById('coords');
  const startBtn = document.getElementById('startBtn');

  startBtn.addEventListener('click', async () => {
    startBtn.style.display = 'none'; // on cache le bouton

    const cameraOk = await setupCameraVideo();
    if (!cameraOk) {
      coordsDiv.textContent = 'Impossible d\'accéder à la caméra';
      return;
    }

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

    // Demande permission orientation puis écoute l'événement
    const orientationAllowed = await requestOrientationPermission();
    if (orientationAllowed) {
      window.addEventListener('deviceorientationabsolute', (e) => {
        if (e.absolute === true && e.alpha !== null) {
          userHeading = 360 - e.alpha; // Calibrage pour que 0° = Nord
        }
      });
    } else {
      coordsDiv.textContent += ' (Orientation non disponible)';
    }

    navigator.geolocation.watchPosition(pos => {
      console.log('Position reçue:', pos.coords.latitude, pos.coords.longitude);
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
      coordsDiv.textContent = 'Erreur géolocalisation: ' + err.message;
    }, {
      enableHighAccuracy: true,
      maximumAge: 1000
    });

    function animate() {
      requestAnimationFrame(animate);

      if (refSet) {
        const objGeoLat = latRef + objGeoLatOffset;
        const objGeoLon = lonRef;

        const pos = latLonToMeters(latRef, lonRef, objGeoLat, objGeoLon);

        camera.position.set(0, 0, 0);
        camera.rotation.set(0, THREE.MathUtils.degToRad(userHeading), 0);

        cube.position.set(pos.x, 0, pos.z);
        cube.visible = true;

        camera.updateMatrix();
        camera.updateMatrixWorld();
      }

      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
    });
  });
};
