import * as THREE from 'three';
import { scene } from './cubes.js';
import { controller1, controller2 } from './vrSetup.js';

const length = 2;
const gravity = 9.81;
const damping = 0.995;
const pendulums = [];
let grabbedPendulum = null;
let grabbedController = null;

// Create a pendulum at a specific position
function createPendulum(position) {
    const armGeometry = new THREE.CylinderGeometry(0.02, 0.02, length, 32);
    const armMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const arm = new THREE.Mesh(armGeometry, armMaterial);

    const bobGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const bobMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const bob = new THREE.Mesh(bobGeometry, bobMaterial);

    arm.position.y = -length / 2;
    bob.position.y = -length;

    const pivot = new THREE.Object3D();
    pivot.add(arm);
    pivot.add(bob);
    pivot.position.copy(position);

    scene.add(pivot);
    
    pendulums.push({ pivot, bob, angle: Math.PI / 4, velocity: 0, acceleration: 0 });

    return pivot;
}

// Raycasting for VR Controller Selection
const raycaster = new THREE.Raycaster();

function grabPendulum(controller) {
    scene.updateMatrixWorld(true);
    
    const rayOrigin = new THREE.Vector3();
    controller.getWorldPosition(rayOrigin);

    const rayDirection = new THREE.Vector3();
    controller.getWorldDirection(rayDirection);
    rayDirection.normalize();

    raycaster.set(rayOrigin, rayDirection);
    
    const intersects = raycaster.intersectObjects(pendulums.map(p => p.bob), true);
    if (intersects.length > 0) {
        grabbedPendulum = pendulums.find(p => p.bob === intersects[0].object);
        grabbedController = controller;
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

// Update pendulum motion
function updatePendulums(deltaTime) {
    pendulums.forEach(p => {
        if (p === grabbedPendulum) {
            // If holding a pendulum, make it follow the controller's position
            const newPos = new THREE.Vector3();
            grabbedController.getWorldPosition(newPos);
            p.pivot.position.copy(newPos);
            return;
        }

        p.acceleration = (-gravity / length) * Math.sin(p.angle);
        p.velocity += p.acceleration * deltaTime;
        p.velocity *= damping;
        p.angle += p.velocity * deltaTime;
        
        p.pivot.rotation.z = p.angle;
    });
}

// Export functions to use in main.js
export { createPendulum, updatePendulums };
