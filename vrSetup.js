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


// Function to Setup Controller Models and Laser Pointer 
function setupController(controller) {
    const controllerGrip = renderer.xr.getControllerGrip(controller === controller1 ? 0 : 1);
    const modelFactory = new XRControllerModelFactory();
    controllerGrip.add(modelFactory.createControllerModel(controllerGrip));

    cameraGroup.add(controllerGrip);


    // Add a laser pointer (line)
    const laserGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1) // Direction of the ray
    ]);
    const laserMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const laser = new THREE.Line(laserGeometry, laserMaterial);
    laser.scale.z = 5;
    laser.visible = true;
    controller.add(laser);
    controller.userData.laser = laser;
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
let selectedCube = null;
let targetPosition = new THREE.Vector3();

function selectCube(controller) {
    const rayOrigin = new THREE.Vector3();
    controller.getWorldPosition(rayOrigin); // Get controller position

    const rayDirection = new THREE.Vector3();
    controller.getWorldDirection(rayDirection); // Get controller forward direction

    raycaster.set(rayOrigin, rayDirection); // Correctly set the raycaster
    const intersects = raycaster.intersectObjects(cubes);

    if (intersects.length > 0) {
        selectedCube = intersects[0].object;
        selectedCube.material.color.set(0xffffff); // Turn white
        targetPosition.copy(cameraGroup.position); // Set target position
    }
}


function moveCubeTowardsPlayer() {
    if (selectedCube) {
        const speed = 0.1; // Adjust movement speed (higher = faster)
        selectedCube.position.lerp(targetPosition, speed); // Smooth transition

        // Stop moving once the cube is close enough
        if (selectedCube.position.distanceTo(targetPosition) < 0.2) {
            selectedCube.position.copy(targetPosition); // Snap to exact position
            selectedCube = null; // Stop movement
        }
    }
}




// 5️ Handle VR Controller Selection (Trigger Button)

controller1.addEventListener('selectstart', () => {
    selectCube(controller1);
});

controller2.addEventListener('selectstart', () => {
    selectCube(controller2);
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

        // Extract the forward direction of the controller
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(controller.quaternion);

        // Ignore vertical tilt to keep the laser perpendicular
        forward.y = 0;
        forward.normalize();

        // Calculate a new quaternion that aligns the laser with the forward direction
        const newQuaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, -1), // Default laser direction
            forward // Adjusted direction without tilt
        );

        controller.userData.laser.quaternion.copy(newQuaternion);
    }
}


// 9️ Prevent Camera from Flipping
function limitCameraPitch() {
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
}

//  Update Loop for VR Controls & Movement
renderer.setAnimationLoop((time, xrFrame) => {
    if (xrFrame) handleJoystickInput(xrFrame);
    limitCameraPitch();
    updateLaserPointer(controller1);
    updateLaserPointer(controller2);
    moveCubeTowardsPlayer();
    renderer.render(scene, camera);
});
