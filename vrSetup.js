import * as THREE from 'three';
import { ImmersiveControls } from '@depasquale/three-immersive-controls';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

// Create scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Enable VR
document.body.appendChild(VRButton.createButton(renderer));
renderer.xr.enabled = true;

// Initialize ImmersiveControls
const controls = new ImmersiveControls(camera, renderer, scene, {
    moveSpeed: { vr: 2.5, keyboard: 5 }, // Adjust movement speed as needed
    rotateSpeed: 1, // Adjust rotation speed as needed
    showControllerModel: true, // Display VR controllers
    showEnterVRButton: true, // Display Enter VR button
    showExitVRButton: true, // Display Exit VR button in VR
    vrControls: true, // Enable VR controls
    keyboardControls: true, // Enable keyboard controls
    mouseControls: true, // Enable mouse controls
    showFps: false // Display FPS stats
});

// Animation loop
function animate() {
    renderer.setAnimationLoop(() => {
        controls.update();
        renderer.render(scene, camera);
    });
}

animate();
