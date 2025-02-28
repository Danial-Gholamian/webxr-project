import * as THREE from 'three';
import { ImmersiveControls } from '@depasquale/three-immersive-controls';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';

// 1️ Setup Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// 2️ Enable VR
document.body.appendChild(VRButton.createButton(renderer));

// 3️ Add Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);

// 4️ Setup Controllers
const controller1 = renderer.xr.getController(0); // Left Hand
const controller2 = renderer.xr.getController(1); // Right Hand
scene.add(controller1);
scene.add(controller2);

// 5️ Add Controller Models
const controllerModelFactory = new XRControllerModelFactory();
const handModelFactory = new XRHandModelFactory();

const controllerGrip1 = renderer.xr.getControllerGrip(0);
controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
scene.add(controllerGrip1);

const controllerGrip2 = renderer.xr.getControllerGrip(1);
controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
scene.add(controllerGrip2);

// 6️ Setup Immersive Controls for Movement
const controls = new ImmersiveControls(camera, renderer, scene, {
    moveSpeed: { vr: 2.5, keyboard: 5 }, // Adjust movement speed
    rotateSpeed: 1.5, // Adjust rotation speed
    showControllerModel: true, // Display controllers in VR
    showEnterVRButton: false, // We already added VRButton manually
    vrControls: true, // Enable thumbstick movement
});

// 7️ Create a Floor
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// 8️ Animation Loop
renderer.setAnimationLoop(() => {
    controls.update(); // Handles movement & rotation
    renderer.render(scene, camera);
});
