import { scene, cubes, camera, renderer } from './cubes.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

// 1 Add VR Button
document.body.appendChild(VRButton.createButton(renderer));
renderer.xr.enabled = true;

// 2 Create Camera Group to Fix Movement Issues
let cameraGroup = new THREE.Group();
cameraGroup.add(camera);
scene.add(cameraGroup);

// 3 VR Controllers (Left = Rotate, Right = Move)
const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
cameraGroup.add(controller1);
cameraGroup.add(controller2);

// 4 Store Selected Cube for Movement
let selectedCube = null;

// 5 Controller Interaction - Selecting Cubes
function onSelectStart(event) {
    const controller = event.target;
    const raycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();

    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    const intersects = raycaster.intersectObjects(cubes);

    if (intersects.length > 0) {
        selectedCube = intersects[0].object;
        selectedCube.material.emissive.set(0x444444); // Highlight cube
    }
}

// 6 Release Cube
function onSelectEnd() {
    if (selectedCube) {
        selectedCube.material.emissive.set(0x000000); // Remove highlight
        selectedCube = null;
    }
}

// 7 Move Selected Cube with Controller
function moveSelectedCube(controller) {
    if (selectedCube) {
        selectedCube.position.copy(controller.position);
    }
}

// Attach event listeners
controller1.addEventListener('selectstart', onSelectStart);
controller1.addEventListener('selectend', onSelectEnd);
controller2.addEventListener('selectstart', onSelectStart);
controller2.addEventListener('selectend', onSelectEnd);

// 8 Set Up VR Controllers with Laser Pointer
function setupController(controller) {
    const controllerGrip = renderer.xr.getControllerGrip(controller === controller1 ? 0 : 1);
    const modelFactory = new XRControllerModelFactory();
    controllerGrip.add(modelFactory.createControllerModel(controllerGrip));
    cameraGroup.add(controllerGrip);

    // Laser Pointer
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
}

setupController(controller1);
setupController(controller2);

// 9 Handle Joystick Movement
const movementSpeed = 0.05;
const rotationSpeed = 0.03;
const deadZone = 0.1;

function moveThumbstick(inputX, inputY, speed = movementSpeed) {
    let direction = new THREE.Vector3();
    cameraGroup.getWorldDirection(direction); // Get forward direction
    direction.y = 0; // Keep movement horizontal
    direction.normalize();

    let right = new THREE.Vector3();
    right.crossVectors(camera.up, direction).normalize();

    if (Math.abs(inputX) > deadZone || Math.abs(inputY) > deadZone) {
        let moveX = right.multiplyScalar(inputX * speed);
        let moveZ = direction.multiplyScalar(-inputY * speed);
        cameraGroup.position.add(moveX).add(moveZ);
    }
}

// 10 Handle Joystick Input
function handleJoystickInput() {
    const session = renderer.xr.getSession();
    if (!session) return;

    for (const source of session.inputSources) {
        if (!source.gamepad) continue;

        const handedness = source.handedness;
        const { axes } = source.gamepad;

        if (axes.length < 4) continue;

        if (handedness === "left") {
            cameraGroup.rotation.y -= axes[2] * rotationSpeed;
        }
        if (handedness === "right") {
            moveThumbstick(axes[2], axes[3]);
        }
    }

    cameraGroup.updateMatrixWorld(true);
}

// 10 Update Laser Pointer Position
function updateLaserPointer(controller) {
    if (controller.userData.laser) {
        controller.userData.laser.position.set(0, 0, 0); // Attach laser to the controller
        controller.userData.laser.quaternion.copy(controller.quaternion);
    }
}

// 10 Prevent Camera from Flipping
function limitCameraPitch() {
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
}

// 10 Main Animation Loop
renderer.setAnimationLoop(() => {
    handleJoystickInput();
    limitCameraPitch();
    updateLaserPointer(controller1);
    updateLaserPointer(controller2);
    moveSelectedCube(controller1);
    moveSelectedCube(controller2);
    renderer.render(scene, camera);
});
