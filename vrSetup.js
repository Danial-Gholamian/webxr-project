
import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { scene, camera, renderer } from './cubes.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

let cameraGroup = new THREE.Group();
cameraGroup.add(camera);
scene.add(cameraGroup);

const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
cameraGroup.add(controller1);
cameraGroup.add(controller2);




// This part is for selecting
let grabbedObject = null;
let grabbedController = null;

const raycaster = new THREE.Raycaster();
const tempMatrix = new THREE.Matrix4();


function getIntersection(controller) {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    
    raycaster.far = 10;  

    return raycaster.intersectObjects(scene.children, true);
}


function onSelectStart(event) {
    const controller = event.target;
    const intersections = getIntersection(controller);

    if (intersections.length > 0) {
        grabbedObject = intersections[0].object;
        grabbedController = controller;

        // Store the original parent before grabbing
        grabbedObject.userData.originalParent = grabbedObject.parent;

        // Attach it to the controller instead of the scene
        controller.attach(grabbedObject);
    }
}


function onSelectEnd(event) {
    if (grabbedObject) {
        // Restore to its original parent instead of scene
        if (grabbedObject.userData.originalParent) {
            grabbedObject.userData.originalParent.attach(grabbedObject);
        }

        grabbedObject = null;
        grabbedController = null;
    }
}

function updatePendulumPosition() {
    if (grabbedObject && grabbedController) {
        let newPos = new THREE.Vector3();
        grabbedController.getWorldPosition(newPos);

        grabbedObject.position.lerp(newPos, 0.5);  
    }
}


function setupController(controller) {
    const controllerGrip = renderer.xr.getControllerGrip(controller === controller1 ? 0 : 1);
    const modelFactory = new XRControllerModelFactory();
    controllerGrip.add(modelFactory.createControllerModel(controllerGrip));

    cameraGroup.add(controllerGrip);

    const laserGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
    ]);
    const laserMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const laser = new THREE.Line(laserGeometry, laserMaterial);
    laser.scale.z = 50;
    controller.add(laser);
    controller.userData.laser = laser;

    controller.addEventListener('selectstart', onSelectStart);
    controller.addEventListener('selectend', onSelectEnd);
}

// function setupController(controller) {
//     const controllerGrip = renderer.xr.getControllerGrip(controller === controller1 ? 0 : 1);
//     const modelFactory = new XRControllerModelFactory();
//     const controllerModel = modelFactory.createControllerModel(controllerGrip);
//     cameraGroup.add(controllerGrip)

//     // Disable motionController animations to avoid missing "menu_pressed_min"
//     controllerModel.motionController = null;

//     controllerGrip.add(controllerModel);
//     cameraGroup.add(controllerGrip);
// }


setupController(controller1);
setupController(controller2);

const controllers = { left: null, right: null };

renderer.xr.addEventListener("sessionstart", () => {
    const session = renderer.xr.getSession();
    session.inputSources.forEach((source) => {
        if (source.handedness === "left") controllers.left = source;
        if (source.handedness === "right") controllers.right = source;
    });
});

const movementSpeed = 0.05;
const rotationSpeed = 0.03;
const deadZone = 0.1;

function moveThumbstick(inputX, inputY, speed = movementSpeed) {
    let direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    let right = new THREE.Vector3();
    right.crossVectors(camera.up, direction).normalize();

    if (Math.abs(inputX) > deadZone || Math.abs(inputY) > deadZone) {
        let moveX = right.multiplyScalar(inputX * speed);
        let moveZ = direction.multiplyScalar(-inputY * speed);
        cameraGroup.position.add(moveX).add(moveZ);
        console.log("Move x: ", moveX);
        console.log("Move z: ", moveZ);
    }
}

function handleJoystickInput(xrFrame) {
    const session = xrFrame.session;

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

function updateLaserPointer(controller) {
    if (controller.userData.laser) {
        controller.userData.laser.position.set(0, 0, 0);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(controller.quaternion);
        forward.y = 0;
        forward.normalize();

        const newQuaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, -1),
            forward
        );

        controller.userData.laser.quaternion.copy(newQuaternion);
    }
}


// ITS NEW FOR TEST MARCH 14 
function handleTriggerClick(controller) {
    controller.addEventListener('selectstart', () => {
        console.log("I'm clicking !!!");

        if (controller.userData.laser) {
            const laserPosition = controller.userData.laser.position;
            console.log(`Laser Position: X=${laserPosition.x}, Y=${laserPosition.y}, Z=${laserPosition.z}`);
        }
    });
}

handleTriggerClick(controller1);
handleTriggerClick(controller2);
// UNTIL HERE 

export { handleJoystickInput, updateLaserPointer, controller1, controller2, cameraGroup, updatePendulumPosition };
