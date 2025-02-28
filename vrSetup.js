import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { scene, camera, renderer, cubes } from './cubes.js';

// Add VR Button for WebXR
document.body.appendChild(VRButton.createButton(renderer));

// VR Controllers (Left = 0, Right = 1)
const controller1 = renderer.xr.getController(0); // Left controller (rotate)
const controller2 = renderer.xr.getController(1); // Right controller (move)
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

// Raycaster for VR Selection
const raycaster = new THREE.Raycaster();

function selectCube(intersects) {
    if (intersects.length > 0) {
        const selectedCube = intersects[0].object;
        selectedCube.material.color.set(0xffffff); // Change to white when selected
    }
}

// Handle VR Controller Selection (Trigger Button)
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

// Movement Variables
const movementSpeed = 0.05;
const rotationSpeed = 0.03;
const movement = { forward: 0, right: 0, rotate: 0 }; // Store movement state

// Function to Read VR Controller Joystick Input
function handleJoystickInput(xrFrame) {
    const session = xrFrame.session;
    if (!session) return;

    for (const source of session.inputSources) {
        if (!source.gamepad) continue;

        const handedness = source.handedness;
        const { axes } = source.gamepad;

        if (axes.length < 2) continue; // Ensure valid input

        if (handedness === "left") {
            movement.rotate = Math.abs(axes[0]) > 0.1 ? axes[0] * rotationSpeed : 0; // Left thumbstick rotates
        }

        if (handedness === "right") {
            movement.forward = Math.abs(axes[1]) > 0.1 ? -axes[1] : 0; // Right thumbstick forward/backward
            movement.right = Math.abs(axes[0]) > 0.1 ? axes[0] : 0; // Right thumbstick left/right
        }
    }

    // Update debug info if element exists
    const debugElement = document.getElementById("debug-info");
    if (debugElement) {
        debugElement.innerText = `Joystick Axes:\nForward: ${movement.forward.toFixed(2)}\nRight: ${movement.right.toFixed(2)}\nRotate: ${movement.rotate.toFixed(2)}`;
    }
}

// Prevent Camera from Flipping
function limitCameraPitch() {
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
}

// Update Loop for Joystick Movement
renderer.setAnimationLoop((time, xrFrame) => {
    if (xrFrame) handleJoystickInput(xrFrame);

    // Apply movement
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0; // Keep movement horizontal

    const right = new THREE.Vector3();
    right.crossVectors(camera.up, forward);

    camera.position.addScaledVector(forward, movement.forward * movementSpeed);
    camera.position.addScaledVector(right, movement.right * movementSpeed);
    camera.rotation.y -= movement.rotate; // Apply rotation

    limitCameraPitch();
    renderer.render(scene, camera);
});
