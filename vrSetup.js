import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { scene, camera, renderer, cubes } from './cubes.js';

// 1️ Add VR Button for WebXR
document.body.appendChild(VRButton.createButton(renderer));
renderer.xr.enabled = true;

// 2️ VR Controllers (Left = 0, Right = 1)
const controller1 = renderer.xr.getController(0); // Left (rotate)
const controller2 = renderer.xr.getController(1); // Right (move)
scene.add(controller1);
scene.add(controller2);

// Track controllers when VR session starts
const controllers = { left: null, right: null };

renderer.xr.addEventListener("sessionstart", () => {
    const session = renderer.xr.getSession();
    session.inputSources.forEach((source) => {
        if (source.handedness === "left") controllers.left = source;
        if (source.handedness === "right") controllers.right = source;
    });
});

// 3️ Raycaster for VR Selection
const raycaster = new THREE.Raycaster();
let previouslySelectedCube = null;

function selectCube(intersects) {
    if (intersects.length > 0) {
        const selectedCube = intersects[0].object;

        // Reset previous selection
        if (previouslySelectedCube && previouslySelectedCube !== selectedCube) {
            previouslySelectedCube.material.color.set(0xff0000); // Default (red)
        }

        // Highlight new selection
        selectedCube.material.color.set(0xffffff); // White when selected
        previouslySelectedCube = selectedCube;
    }
}

// 4️ Handle VR Controller Selection (Trigger Button)
controller1.addEventListener('selectstart', () => {
    raycaster.set(controller1.position, camera.getWorldDirection(new THREE.Vector3()));
    const intersects = raycaster.intersectObjects(cubes);
    selectCube(intersects);
});

controller2.addEventListener('selectstart', () => {
    raycaster.set(controller2.position, camera.getWorldDirection(new THREE.Vector3()));
    const intersects = raycaster.intersectObjects(cubes);
    selectCube(intersects);
});

// 5️ Movement Variables
const movementSpeed = 0.05;
const rotationSpeed = 0.03;

// 6️ Handle VR Joystick Input for Movement & Rotation
function handleJoystickInput(xrFrame) {
    const session = xrFrame.session;
    for (const source of session.inputSources) {
        if (!source.gamepad) continue;

        const { handedness, gamepad } = source;
        const { axes } = gamepad;

        if (axes.length < 4) continue; // Ensure the controller has joystick axes

        // Left Controller (Rotate Camera)
        if (handedness === "left") {
            camera.rotation.y -= axes[2] * rotationSpeed;
        }

        // Right Controller (Move Camera)
        if (handedness === "right") {
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            forward.y = 0; // Keep movement horizontal

            const right = new THREE.Vector3();
            right.crossVectors(camera.up, forward).normalize();

            camera.position.addScaledVector(forward, -axes[3] * movementSpeed); // Forward/backward
            camera.position.addScaledVector(right, axes[2] * movementSpeed); // Left/right
        }
    }
}

// 7️ Prevent Camera from Flipping
function limitCameraPitch() {
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
}

// 8️ Update Loop for VR Controls & Movement
renderer.setAnimationLoop((time, xrFrame) => {
    if (xrFrame) handleJoystickInput(xrFrame);
    limitCameraPitch();
    renderer.render(scene, camera);
});
