
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
    }
  }
  

  function onSelectEnd(event) {
    grabbedObject = null;
    grabbedController = null;
  }
  

  function updatePendulumPosition() {
    if (grabbedObject && grabbedController) {
      // Get world position of controller
      const controllerPos = new THREE.Vector3();
      grabbedController.getWorldPosition(controllerPos);
  
      // Optionally smooth motion
      grabbedObject.position.lerp(controllerPos, 0.5);
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

cameraGroup.add(controller);

controller.addEventListener('selectstart', onSelectStart);
controller.addEventListener('selectend', onSelectEnd);
}
  



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
      // If you want to dynamically adjust length, you can still do that
      controller.userData.laser.scale.z = 50;
      // No need to manually update position or rotation —
      // it's already a child of the controller and follows it automatically
    }
  }
  


// ITS NEW FOR TEST MARCH 14 
function handleTriggerClick(controller) {
    controller.addEventListener('selectstart', () => {
      console.log("I'm clicking !!!");
  
      if (controller.userData.laser) {
        const laserWorldPos = new THREE.Vector3();
        controller.userData.laser.getWorldPosition(laserWorldPos);
        console.log(`Laser World Position: X=${laserWorldPos.x}, Y=${laserWorldPos.y}, Z=${laserWorldPos.z}`);
      }
    });
  }
  

handleTriggerClick(controller1);
handleTriggerClick(controller2);
// UNTIL HERE 

export { handleJoystickInput, updateLaserPointer, controller1, controller2, cameraGroup, updatePendulumPosition };
