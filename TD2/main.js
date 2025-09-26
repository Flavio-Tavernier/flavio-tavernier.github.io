import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


// Creating the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color('#FF9482');
scene.fog = new THREE.Fog(0xcccccc, 50, 300);
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

// Creating the texture
const loader = new THREE.TextureLoader();
const texture = loader.load( './ressources/images/face.png' );
texture.colorSpace = THREE.SRGBColorSpace;

// Creating the sphere
const geometry = new THREE.SphereGeometry(10, 32, 32);
const material = new THREE.MeshStandardMaterial( { map: texture } );
const sphere  = new THREE.Mesh( geometry, material );
scene.add(sphere);

camera.position.z = 150;

// Creating the light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// --- AJOUT du chargement du modèle 3D GLTF ---
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  './ressources/models/Flower.glb',       // chemin vers ton fichier 3D
  (gltf) => {
    gltf.scene.position.set(10, 0, 50); 
    gltf.scene.scale.set(50, 50, 50);  // optionnel : adapte la taille
    scene.add(gltf.scene);
    console.log('Modèle 3D chargé');
  },
  (xhr) => {
    console.log(`Chargement modèle 3D : ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
  },
  (error) => {
    console.error('Erreur chargement modèle 3D', error);
  }
);


const controls = new OrbitControls(camera, renderer.domElement);

// Rendering the scene
function animate() {
  sphere.rotation.x += 0.01;
  sphere.rotation.y += 0.01;

  controls.update();
  renderer.render( scene, camera );
}
