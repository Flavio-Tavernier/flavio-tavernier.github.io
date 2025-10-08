import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// === INITIALISATION SCÈNE ===
const container = document.getElementById('three-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#000000');
scene.fog = new THREE.Fog(0xcccccc, 50, 300);

const camera = new THREE.PerspectiveCamera(
  75,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Lumière
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Texture Terre
const loader = new THREE.TextureLoader();
const texture = loader.load('./ressources/images/earthmap.jpg');
texture.colorSpace = THREE.SRGBColorSpace;

// Terre
const geometry = new THREE.SphereGeometry(1, 64, 64);
const material = new THREE.MeshStandardMaterial({ map: texture });
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Contrôles
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0); // Toujours centre de la Terre

// Raycaster et souris pour détection clic globe
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Marqueur rouge unique sur le globe
let currentMarker = null;

// === UTILS ===

function latLonToCartesian(lat, lon, radius = 1) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(-lon);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

function cartesianToLatLon(pos) {
  const radius = pos.length();
  const lat = 90 - THREE.MathUtils.radToDeg(Math.acos(pos.y / radius));
  const lon = -THREE.MathUtils.radToDeg(Math.atan2(pos.z, pos.x));
  return { lat, lon };
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

function addFlagMarkerAt(flagUrl, lat, lon) {
  const loader = new THREE.TextureLoader();
  loader.load(flagUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const aspectRatio = texture.image.height / texture.image.width;
    const width = 0.05;
    const height = width * aspectRatio;
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    const pos = latLonToCartesian(lat, lon, 1.02);
    mesh.position.copy(pos);
    mesh.lookAt(pos.clone().multiplyScalar(2));
    scene.add(mesh);
  });
}

function addLeafletMarker(lat, lon, name) {
  if (!leafletMap) {
    pendingLeafletMarkers.push({ lat, lon, name });
    return;
  }
  L.marker([lat, lon]).addTo(leafletMap).bindPopup(`<strong>${name}</strong>`);
}

async function addAllCountryFlags() {
  try {
    const countries = await fetchJson(
      'https://restcountries.com/v3.1/all?fields=latlng,flags,name'
    );
    countries.forEach((country) => {
      if (!country.latlng || !country.flags || !country.name) return;
      const [lat, lon] = country.latlng;
      const flagUrl = country.flags.png || country.flags.svg;
      const name = country.name.common;
      if (!flagUrl) return;

      // Ajouter drapeau 3D
      addFlagMarkerAt(flagUrl, lat, lon);

      // Ajouter marqueur sur la carte
      addLeafletMarker(lat, lon, name);
    });
  } catch (err) {
    console.error('Erreur chargement drapeaux :', err);
  }
}

function addMarkerToEarth(lat, lon) {
  if (currentMarker) {
    scene.remove(currentMarker);
    currentMarker.geometry.dispose();
    currentMarker.material.dispose();
    currentMarker = null;
  }
  const position = latLonToCartesian(lat, lon, 1.01);
  const geometry = new THREE.SphereGeometry(0.01, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  currentMarker = new THREE.Mesh(geometry, material);
  currentMarker.position.copy(position);
  scene.add(currentMarker);
}

// === GÉOLOCALISATION & LEAFLET ===
let mapInitialized = false;
let leafletMap = null;
let pendingLeafletMarkers = [];

function getGeolocation() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const longitude = position.coords.longitude;
        const latitude = position.coords.latitude;
        if (!mapInitialized) {
          initializeMap(longitude, latitude);
        }
        addMarkerToEarth(latitude, longitude);
      },
      (error) => {
        console.warn('Erreur de géolocalisation :', error.message);
      }
    );
  } else {
    console.log('Géolocalisation indisponible');
  }
}

function initializeMap(lon, lat) {
  if (mapInitialized) return;
  mapInitialized = true;
  leafletMap = L.map('map').setView([lat, lon], 2); // vue monde
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(leafletMap);

  // Marqueur de position
  L.marker([lat, lon])
    .addTo(leafletMap)
    .bindPopup('Vous êtes ici')
    .openPopup();

  // Ajouter les marqueurs en attente
  pendingLeafletMarkers.forEach(({ lat, lon, name }) => {
    addLeafletMarker(lat, lon, name);
  });
  pendingLeafletMarkers = [];

  // --- Ajout interaction clic Leaflet ---
  leafletMap.on('click', (e) => {
    const { lat, lng } = e.latlng;

    // Ajouter marqueur sur le globe
    addMarkerToEarth(lat, lng);

    // Calculer position 3D sur globe
    const targetPos = latLonToCartesian(lat, lng, 1);

    // Garder cible controls au centre
    controls.target.set(0, 0, 0);

    // Positionner caméra sur la ligne vers targetPos, mais regarder le centre
    const camDistance = 3;
    camera.position.copy(targetPos.clone().multiplyScalar(camDistance));
    camera.lookAt(0, 0, 0);

    controls.update();
  });
}

// === INTERACTION CLIC SUR LE GLOBE ===
renderer.domElement.addEventListener('click', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();

  // Normaliser coordonnées souris entre -1 et 1
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(sphere);
  if (intersects.length > 0) {
    const point = intersects[0].point;
    const { lat, lon } = cartesianToLatLon(point);

    // Recentrer Leaflet
    if (leafletMap) {
      leafletMap.setView([lat, lon], 4);
    }

    // Ajouter marqueur rouge sur le globe
    addMarkerToEarth(lat, lon);
  }
});

// === ANIMATION ===
function animate() {
  // sphere.rotation.y += 0.005; // décommente pour rotation auto
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// === LANCEMENT ===
addAllCountryFlags();
getGeolocation();
animate();

window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});
