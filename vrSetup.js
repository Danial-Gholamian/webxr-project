import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { scene, camera, renderer, cubes } from './cubes.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

// 1️ Add VR Button for WebXR
document.body.appendChild(VRButton.createButton(renderer));
renderer.xr.enabled = true;

// 2️ Create a Parent Group for the Camera (Fix Movement Issue)
let cameraGroup = new THREE.Group();
cameraGroup.add(camera);
scene.add(cameraGroup); // Add the group to the scene

// 3️ VR Controllers (Left = 0, Right = 1)
const controller1 = renderer.xr.getController(0); // Left (rotate)
const controller2 = renderer.xr.getController(1); // Right (move)
// scene.add(controller1);
// scene.add(controller2);
cameraGroup.add(controller1);
cameraGroup.add(controller2);


// Function to Setup Controller Models and Laser Pointer **NEW**
function setupController(controller) {
    const controllerGrip = renderer.xr.getControllerGrip(controller === controller1 ? 0 : 1);
    const modelFactory = new XRControllerModelFactory();
    controllerGrip.add(modelFactory.createControllerModel(controllerGrip));

    scene.add(controllerGrip); // Keep controllers in scene

    // Add a laser pointer
    const laserGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
    ]);
    const laserMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const laser = new THREE.Line(laserGeometry, laserMaterial);
    laser.scale.z = 5;
    laser.visible = true;
    controller.add(laser);
    controller.userData.laser = laser;

    // Store the controller's initial offset from the cameraGroup
    controller.userData.offset = new THREE.Vector3();
    cameraGroup.worldToLocal(controller.getWorldPosition(controller.userData.offset));
}

// Call setup for each controller
setupController(controller1);
setupController(controller2);

// Track controllers when VR session starts
const controllers = { left: null, right: null };

renderer.xr.addEventListener("sessionstart", () => {
    const session = renderer.xr.getSession();
    session.inputSources.forEach((source) => {
        if (source.handedness === "left") controllers.left = source;
        if (source.handedness === "right") controllers.right = source;
    });
});

// 4️ Raycaster for VR Selection
const raycaster = new THREE.Raycaster();
let previouslySelectedCube = null;

function selectCube(intersects) {
    if (intersects.length > 0) {
        const selectedCube = intersects[0].object;
        selectedCube.material.color.set(0xffffff); // Change to white when selected
    }
}

// 5️ Handle VR Controller Selection (Trigger Button)
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

// 6️ Movement Variables
const movementSpeed = 0.05;
const rotationSpeed = 0.03;
const deadZone = 0.1; // Ignore small joystick movements

// 7️ Function to Move the Camera Group Based on Thumbstick Input
function moveThumbstick(inputX, inputY, speed = movementSpeed) {
    let direction = new THREE.Vector3();
    camera.getWorldDirection(direction); // Get forward direction
    direction.y = 0; // Keep movement horizontal
    direction.normalize();

    let right = new THREE.Vector3();
    right.crossVectors(camera.up, direction).normalize(); // Get right direction

    // Apply movement only if input is beyond the dead zone
    if (Math.abs(inputX) > deadZone || Math.abs(inputY) > deadZone) {
        let moveX = right.multiplyScalar(inputX * speed);
        let moveZ = direction.multiplyScalar(-inputY * speed);
        cameraGroup.position.add(moveX).add(moveZ);
    }
}

// 8️ Handle VR Joystick Input for Movement & Rotation
function handleJoystickInput(xrFrame) {
    const session = xrFrame.session;

    for (const source of session.inputSources) {
        if (!source.gamepad) continue;

        const handedness = source.handedness;
        const { axes } = source.gamepad;

        if (axes.length < 4) continue; // Ensure enough axes exist

        // Check if at least one axis has movement
        const hasMovement = axes.some(axis => Math.abs(axis) > deadZone);
        if (hasMovement) {
            console.log(`${handedness} Controller Moved - Axes:`, axes);
        }

        // Left Thumbstick: Rotate Camera Group
        if (handedness === "left") {
            cameraGroup.rotation.y -= axes[2] * rotationSpeed;
        }

        // Right Thumbstick: Move Camera Group
        if (handedness === "right") {
            moveThumbstick(axes[2], axes[3]);
        }
    }

    // Force camera updates
    cameraGroup.updateMatrixWorld(true);

    // Log camera position to confirm movement
    console.log(`Camera Group Position: x=${cameraGroup.position.x}, y=${cameraGroup.position.y}, z=${cameraGroup.position.z}`);
}

function updateLaserPointer(controller) {
    if (controller.userData.laser) {
        controller.userData.laser.position.set(0, 0, 0); // Keep laser at controller origin

        // Get the world direction of the controller
        const worldDirection = new THREE.Vector3();
        controller.getWorldDirection(worldDirection);

        // Ignore any upward/downward tilt
        worldDirection.y = 0;
        worldDirection.normalize();

        // Update the laser direction
        const newQuaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, -1), // Default laser forward direction
            worldDirection // Adjusted direction
        );

        controller.userData.laser.quaternion.copy(newQuaternion);
    }
}


// 9️ Prevent Camera from Flipping
function limitCameraPitch() {
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
}

function updateControllerPosition(controller) {
    if (controller) {
        // Convert stored local offset to world position
        const worldOffset = cameraGroup.localToWorld(controller.userData.offset.clone());
        controller.position.copy(worldOffset);
    }
}

renderer.setAnimationLoop((time, xrFrame) => {
    if (xrFrame) handleJoystickInput(xrFrame);
    limitCameraPitch();

    // Keep controllers following movement
    updateControllerPosition(controller1);
    updateControllerPosition(controller2);

    // Ensure lasers stay properly aligned
    updateLaserPointer(controller1);
    updateLaserPointer(controller2);

    renderer.render(scene, camera);
});
