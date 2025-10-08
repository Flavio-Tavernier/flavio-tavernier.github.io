// index.js

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
  video.playsInline = true; // iPhone requirement
  document.body.appendChild(video);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = stream;
  } catch (err) {
    alert('Erreur accès caméra : ' + err.message);
  }
}

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
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  return map;
}

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

function latLonToMeters(latRef, lonRef, lat, lon) {
  const earthRadius = 6378137; // m
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
  await setupCameraVideo();

  const waitingMsg = document.createElement('div');
  waitingMsg.style.position = 'fixed';
  waitingMsg.style.top = '50%';
  waitingMsg.style.left = '50%';
  waitingMsg.style.transform = 'translate(-50%, -50%)';
  waitingMsg.style.color = 'white';
  waitingMsg.style.fontSize = '1.5rem';
  waitingMsg.style.backgroundColor = 'rgba(0,0,0,0.5)';
  waitingMsg.style.padding = '1rem 2rem';
  waitingMsg.style.borderRadius = '8px';
  waitingMsg.style.zIndex = '2000';
  waitingMsg.textContent = 'En attente de géolocalisation...';
  document.body.appendChild(waitingMsg);

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
  } catch (e) {
    alert('Erreur ou refus permission géolocalisation : ' + e.message);
    waitingMsg.textContent = 'Erreur géolocalisation';
    return;
  }

  const map = setupMap();
  map.setView([latRef, lonRef], 18);

  const { renderer, scene, camera } = setupThree();

  // Création cube rouge 3D
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  const frustum = new THREE.Frustum();
  const cameraViewProjectionMatrix = new THREE.Matrix4();

  // Position du cube à 5m au nord du point référence
  const objGeoLatOffset = 0.000045; // ~5m latitude
  let objGeoLat = latRef + objGeoLatOffset;
  let objGeoLon = lonRef;

  // Ecoute orientation absolue (alpha = rotation Z)
  window.addEventListener('deviceorientationabsolute', e => {
    if (e.absolute === true && e.alpha !== null) {
      userHeading = e.alpha;
    }
  });

  // Met à jour la position GPS régulièrement
  navigator.geolocation.watchPosition(pos => {
    userLat = pos.coords.latitude;
    userLon = pos.coords.longitude;

    if (!refSet) {
      latRef = userLat;
      lonRef = userLon;
      map.setView([latRef, lonRef], 18);
      refSet = true;
      waitingMsg.remove();
    }

    map.setView([userLat, userLon]);
  }, err => {
    console.error('Erreur géoloc:', err);
  }, {
    enableHighAccuracy: true,
    maximumAge: 1000
  });

  function animate() {
    requestAnimationFrame(animate);

    if (refSet) {
      // Actualiser position cube si ref bouge (rare)
      objGeoLat = latRef + objGeoLatOffset;
      objGeoLon = lonRef;

      const pos = latLonToMeters(latRef, lonRef, objGeoLat, objGeoLon);

      const headingRad = THREE.MathUtils.degToRad(userHeading);

      camera.position.set(0, 0, 0);
      camera.rotation.set(0, 0, 0);

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
