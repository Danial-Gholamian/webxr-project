import * as THREE from 'three';

import { scene } from './cubes.js';
import { controller1, controller2 } from './vrSetup.js';

const length = 2;
const gravity = 9.81;
const damping = 0.995;
export const pendulums = [];  // ✅ Now correctly exported
let grabbedPendulum = null;
let grabbedController = null;

// Load high-quality Matcap texture
const matcapTexture = new THREE.TextureLoader().load(
    'https://raw.githubusercontent.com/nidorx/matcaps/master/1024/5C4E41_CCCDD6_9B979B_B1AFB0.png'
);

function createPendulum(position) {
    const armGeometry = new THREE.CylinderGeometry(0.02, 0.02, length, 32);
    const armMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture });
    const arm = new THREE.Mesh(armGeometry, armMaterial);

    const bobGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const bobMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture });
    const bob = new THREE.Mesh(bobGeometry, bobMaterial);

    arm.position.y = -length / 2;
    bob.position.y = -length;

    // Group pendulum objects into a single Object3D
    const pivot = new THREE.Object3D();
    pivot.add(arm);
    pivot.add(bob);
    pivot.position.copy(position);

    // Add bounding box
    pivot.userData.boundingBox = new THREE.Box3().setFromObject(pivot);

    scene.add(pivot);
    
    pendulums.push({ pivot, bob, arm, angle: Math.PI / 4, velocity: 0, acceleration: 0 });

    return pivot;
}

// Raycasting for VR Controller Selection
const raycaster = new THREE.Raycaster();

function grabPendulum(controller) {
    scene.updateMatrixWorld(true);

    const rayOrigin = new THREE.Vector3();
    controller.getWorldPosition(rayOrigin);

    const rayDirection = new THREE.Vector3();
    controller.getWorldDirection(rayDirection).normalize().multiplyScalar(5);

    raycaster.set(rayOrigin, rayDirection);
    const intersects = raycaster.intersectObjects(pendulums.map(p => p.pivot), true);

    if (intersects.length > 0) {
        grabbedPendulum = pendulums.find(p => p.pivot === intersects[0].object);
        grabbedController = controller;
        console.log("Pendulum grabbed:", grabbedPendulum.pivot.position);
    } else {
        console.log("No pendulum detected.");
    }
}

function releasePendulum() {
    if (grabbedPendulum) {
        grabbedPendulum.velocity = 0;
        grabbedPendulum.acceleration = 0;
        grabbedPendulum = null;
        grabbedController = null;
    }
}

// Attach VR Controller Events
controller1.addEventListener('selectstart', () => grabPendulum(controller1));
controller2.addEventListener('selectstart', () => grabPendulum(controller2));
controller1.addEventListener('selectend', releasePendulum);
controller2.addEventListener('selectend', releasePendulum);

function updatePendulums(deltaTime) {
    pendulums.forEach((p, index) => {
        if (index < 5) {  
            console.log(`Pendulum ${index}: Position:`, p.pivot.position);
        }

        if (p === grabbedPendulum) {
            const newPos = new THREE.Vector3();
            grabbedController.getWorldPosition(newPos);
            p.pivot.position.lerp(newPos, 0.8);  
            return;
        }

        p.acceleration = (-gravity / length) * Math.sin(p.angle);
        p.velocity += p.acceleration * deltaTime;
        p.velocity *= damping;
        p.angle += p.velocity * deltaTime;
        p.pivot.rotation.z = p.angle;
    });
}

export { createPendulum, updatePendulums };
