import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { scene, camera, renderer, cubes } from './cubes.js';

//  Add VR Button for WebXR
document.body.appendChild(VRButton.createButton(renderer));

// VR Controllers (Left = 0, Right = 1)
const controller1 = renderer.xr.getController(0); // Left controller (rotate)
const controller2 = renderer.xr.getController(1); // Right controller (move)
scene.add(controller1);
scene.add(controller2);

//  Add Controllers to Scene & Track Gamepads
const controllers = new Map();

function setupController(controller) {
    controller.addEventListener('connected', (event) => {
        controllers.set(event.data.handedness, event.data);
    });

    controller.addEventListener('disconnected', (event) => {
        controllers.delete(event.data.handedness);
    });
}

setupController(controller1);
setupController(controller2);

//  Raycaster for VR Selection
const raycaster = new THREE.Raycaster();

function selectCube(intersects) {
    if (intersects.length > 0) {
        const selectedCube = intersects[0].object;
        selectedCube.material.color.set(0xffffff); // Change to white when selected
    }
}

//  Handle VR Controller Selection (Trigger Button)
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

//  Function to Read VR Controller Joystick Input
function handleJoystickInput() {
    const session = renderer.xr.getSession();
    if (!session) return;

    const inputSources = session.inputSources;

    for (const source of inputSources) {
        if (!source.gamepad) continue;

        const { axes } = source.gamepad;
        const handedness = source.handedness; // "left" or "right"

        // LEFT Controller (Rotate Camera)
        if (handedness === "left") {
            const rotationY = axes[2] * rotationSpeed; // Left/right rotation
            camera.rotation.y -= rotationY;
        }

        // RIGHT Controller (Move Camera)
        if (handedness === "right") {
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            forward.y = 0; // Keep movement horizontal

            const right = new THREE.Vector3();
            right.crossVectors(camera.up, forward);

            camera.position.addScaledVector(forward, -axes[3] * movementSpeed); // Forward/backward
            camera.position.addScaledVector(right, axes[2] * movementSpeed); // Left/right
        }
    }
}

// Prevent Camera from Flipping
function limitCameraPitch() {
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
}

// Update Loop for Joystick Movement
renderer.setAnimationLoop(() => {
    handleJoystickInput();
    limitCameraPitch();
    renderer.render(scene, camera);
});
