import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { scene, camera, renderer, cubes } from './cubes.js';

// 1️ Enable VR
document.body.appendChild(VRButton.createButton(renderer));
renderer.xr.enabled = true;

// 2️ Setup VR Controllers
const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
scene.add(controller1, controller2);

const controllers = { left: null, right: null };

// Track VR controllers dynamically
renderer.xr.addEventListener("sessionstart", () => {
    const session = renderer.xr.getSession();
    session.addEventListener("inputsourceschange", (event) => {
        event.added.forEach((source) => {
            if (source.gamepad) {
                if (source.handedness === "left") controllers.left = source;
                if (source.handedness === "right") controllers.right = source;
            }
        });
    });
});

// 3️ Raycasting for Object Selection
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

// 4️ Handle Controller Selection (Trigger Button)
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

// 5️ Movement & Rotation Parameters
const movementSpeed = 0.05;
const rotationSpeed = 0.03;

// 6️ Handle Thumbstick Movement
function handleJoystickInput(xrFrame) {
    const session = xrFrame.session;
    for (const source of session.inputSources) {
        if (!source.gamepad) continue;

        const { handedness, gamepad } = source;
        const { axes } = gamepad;

        if (axes.length < 4) continue; // Ensure thumbsticks exist

        if (handedness === "left") {
            // Rotate camera left/right
            camera.rotation.y -= axes[2] * rotationSpeed;
        }

        if (handedness === "right") {
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            forward.y = 0; // Keep movement horizontal
            forward.normalize();

            const right = new THREE.Vector3();
            right.crossVectors(camera.up, forward).normalize();

            // Move forward/backward (Y-axis of right thumbstick)
            camera.position.addScaledVector(forward, -axes[3] * movementSpeed);
            // Move left/right (X-axis of right thumbstick)
            camera.position.addScaledVector(right, axes[2] * movementSpeed);
        }
    }
}

// 7️ Prevent Camera Flipping
function limitCameraPitch() {
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
}

// 8️ Animation Loop
renderer.setAnimationLoop((time, xrFrame) => {
    if (xrFrame) handleJoystickInput(xrFrame);
    limitCameraPitch();
    renderer.render(scene, camera);
});
