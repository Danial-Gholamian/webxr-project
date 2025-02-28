import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { scene, camera, renderer, cubes } from './cubes.js';

// Add VR Button for WebXR
document.body.appendChild(VRButton.createButton(renderer));

// VR Controllers (Left = 0, Right = 1)
const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
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

// Movement Variables
const movementSpeed = 0.05;
const rotationSpeed = 0.03;
const deadZone = 0.2;
const movement = { forward: 0, right: 0, rotate: 0 };
let speedMultiplier = 1.0;

// Create Raycaster for VR Selection
const raycaster = new THREE.Raycaster();

// Function to Handle Joystick Input
function handleJoystickInput(xrFrame) {
    const session = xrFrame.session;
    if (!session) return;

    for (const source of session.inputSources) {
        if (!source.gamepad) continue;
        const { handedness, gamepad } = source;
        const { axes } = gamepad;

        if (axes.length < 2) continue;

        if (handedness === "left") {
            movement.rotate = Math.abs(axes[0]) > deadZone ? axes[0] * rotationSpeed : 0;
        }

        if (handedness === "right") {
            movement.forward = Math.abs(axes[1]) > deadZone ? -axes[1] : 0;
            movement.right = Math.abs(axes[0]) > deadZone ? axes[0] : 0;
        }
    }
}

// Prevent Camera from Flipping
function limitCameraPitch() {
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
}

// Setup Controller Events
function setupControllerEvents(controller) {
    controller.addEventListener('squeezestart', () => speedMultiplier = 2.0);
    controller.addEventListener('squeezeend', () => speedMultiplier = 1.0);

    controller.addEventListener('selectstart', () => {
        raycaster.setFromMatrixPosition(controller.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyQuaternion(controller.quaternion);
        const intersects = raycaster.intersectObjects(cubes);
        selectCube(intersects);
    });
}

setupControllerEvents(controller1);
setupControllerEvents(controller2);

// Calculate Movement Vectors
let forward = new THREE.Vector3();
let right = new THREE.Vector3();

function updateMovementVectors() {
    camera.getWorldDirection(forward);
    forward.y = 0; // Keep movement horizontal

    right.crossVectors(camera.up, forward);
}

// Handle Cube Selection
function selectCube(intersects) {
    if (intersects.length > 0) {
        const selectedCube = intersects[0].object;
        selectedCube.material.emissive.set(0xffffff); // Glow effect
        selectedCube.scale.set(1.2, 1.2, 1.2); // Slightly enlarge the cube

        // Reset scale after 300ms
        setTimeout(() => selectedCube.scale.set(1, 1, 1), 300);
    }
}

// Update Loop
renderer.setAnimationLoop((time, xrFrame) => {
    if (xrFrame) handleJoystickInput(xrFrame);

    updateMovementVectors();
    camera.position.addScaledVector(forward, movement.forward * movementSpeed * speedMultiplier);
    camera.position.addScaledVector(right, movement.right * movementSpeed * speedMultiplier);
    camera.rotation.y -= movement.rotate;

    limitCameraPitch();
    renderer.render(scene, camera);
});
