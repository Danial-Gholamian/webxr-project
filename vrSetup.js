import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { scene, camera, renderer, cubes } from './cubes.js';

// 1️ Add VR Button
document.body.appendChild(VRButton.createButton(renderer));

// 2️ VR Controllers (Left = 0, Right = 1)
const controller1 = renderer.xr.getController(0); // Left controller
const controller2 = renderer.xr.getController(1); // Right controller
scene.add(controller1);
scene.add(controller2);

// 3️ Raycaster for VR Selection
const raycaster = new THREE.Raycaster();

function selectCube(intersects) {
    if (intersects.length > 0) {
        const selectedCube = intersects[0].object;
        selectedCube.material.color.set(0xffffff); // Change to white when selected
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

// 5️ Add Joystick (Thumbstick) Movement
const movementSpeed = 0.05;
const rotationSpeed = 0.03;

function handleJoystickInput(controller) {
    if (!controller || !controller.gamepad) return;

    const { axes } = controller.gamepad;

    // Left joystick (Rotate Scene)
    if (controller === controller1) {
        scene.rotation.y -= axes[2] * rotationSpeed; // Left/right rotation
    }

    // Right joystick (Move Camera)
    if (controller === controller2) {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);

        const right = new THREE.Vector3();
        right.crossVectors(camera.up, forward);

        camera.position.addScaledVector(forward, -axes[3] * movementSpeed); // Forward/backward
        camera.position.addScaledVector(right, axes[2] * movementSpeed); // Left/right
    }
}

// 6️ Update Loop for VR Joystick Movement
renderer.setAnimationLoop(() => {
    handleJoystickInput(controller1);
    handleJoystickInput(controller2);
    renderer.render(scene, camera);
});
