// index.js

// IMPORTANT :
// - En mode simple sans bundler, on suppose que 'THREE' et 'L' (Leaflet) sont chargés via CDN dans HTML
// - Donc pas d'import ici, on utilise les objets globaux THREE et L

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
  }).setView([0, 0], 15);

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

// Convertit lat/lon en coordonnées 3D relatives (mètres) par rapport à un point référence
function latLonToMeters(latRef, lonRef, lat, lon) {
  const earthRadius = 6378137; // m
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

  let refSet = false;
  let latRef = 0;
  let lonRef = 0;

  // Création du cube 3D rouge
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Frustum caméra pour test visibilité
  const frustum = new THREE.Frustum();
  const cameraViewProjectionMatrix = new THREE.Matrix4();

  // Mise à jour position GPS
  navigator.geolocation.watchPosition(pos => {
    userLat = pos.coords.latitude;
    userLon = pos.coords.longitude;

    if (!refSet) {
      latRef = userLat;
      lonRef = userLon;
      map.setView([latRef, lonRef], 18);
      refSet = true;
    }

    map.setView([userLat, userLon]);
  }, err => {
    console.error('Erreur géoloc:', err);
  }, {
    enableHighAccuracy: true,
    maximumAge: 1000
  });

  // Récupérer orientation absolue (alpha = rotation Z)
  window.addEventListener('deviceorientationabsolute', e => {
    if (e.absolute === true && e.alpha !== null) {
      userHeading = e.alpha;
    }
  });

  // Position du cube à 5m au nord du point de référence
  const objGeoLatOffset = 0.000045; // environ 5m
  let objGeoLat = latRef + objGeoLatOffset;
  let objGeoLon = lonRef;

  // Update loop Three.js
  function animate() {
    requestAnimationFrame(animate);

    if (refSet) {
      // On met à jour la position du cube si la référence a changé
      objGeoLat = latRef + objGeoLatOffset;
      objGeoLon = lonRef;

      // Coordonnées relatives
      const pos = latLonToMeters(latRef, lonRef, objGeoLat, objGeoLon);

      // Rotation caméra en fonction orientation smartphone (axe Y)
      const headingRad = THREE.MathUtils.degToRad(userHeading);

      camera.position.set(0, 0, 0);
      camera.rotation.set(0, 0, 0);

      // On tourne la scène en sens inverse pour simuler la rotation du smartphone
      scene.rotation.y = -headingRad;

      // Position cube
      cube.position.set(pos.x, 0, pos.z);

      // Calcul frustum et visibilité
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

  // Resize handler
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
  });
}

main();
