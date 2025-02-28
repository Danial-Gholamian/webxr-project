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

// Function to Read VR Controller Joystick Input
function handleJoystickInput(xrFrame) {
    const session = xrFrame.session;
    let debugText = "Joystick Axes:\n";

    for (const source of session.inputSources) {
        if (!source.gamepad) continue;

        const handedness = source.handedness;
        const { axes } = source.gamepad;

        debugText += `${handedness} Controller: [${axes.map(a => a.toFixed(2)).join(", ")}]\n`;

        if (axes.length < 4) continue;

        // Left Controller (Rotate Camera)
        if (handedness === "left") {
            camera.rotation.y -= axes[2] * rotationSpeed;
        }

        // Right Controller (Move Camera)
        if (handedness === "right") {
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            forward.y = 0;

            const right = new THREE.Vector3();
            right.crossVectors(camera.up, forward);

            camera.position.addScaledVector(forward, -axes[3] * movementSpeed);
            camera.position.addScaledVector(right, axes[2] * movementSpeed);
        }
    }

    document.getElementById("debug-info").innerText = debugText;
}


// Prevent Camera from Flipping
function limitCameraPitch() {
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
}

// Update Loop for Joystick Movement
renderer.setAnimationLoop((time, xrFrame) => {
    if (xrFrame) handleJoystickInput(xrFrame);
    limitCameraPitch();
    renderer.render(scene, camera);
});
