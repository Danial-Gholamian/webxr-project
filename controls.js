import * as THREE from 'three';
import { scene, camera, cubes } from './cubes.js';

// Raycaster for Mouse Selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function selectCube(intersects) {
    if (intersects.length > 0) {
        const selectedCube = intersects[0].object;
        selectedCube.material.color.set(0xffffff);
    }
}

// Mouse Click Selection
window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubes);
    selectCube(intersects);
});

// Keyboard Movement Data
const movementSpeed = 0.1;
const movement = { forward: 0, right: 0 };

window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'w': case 'ArrowUp': movement.forward = 1; break;
        case 's': case 'ArrowDown': movement.forward = -1; break;
        case 'a': case 'ArrowLeft': movement.right = 1; break;
        case 'd': case 'ArrowRight': movement.right = -1; break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'w': case 'ArrowUp': case 's': case 'ArrowDown': movement.forward = 0; break;
        case 'a': case 'ArrowLeft': case 'd': case 'ArrowRight': movement.right = 0; break;
    }
});

// Mouse Look
let isDragging = false;
let previousMouseX = 0, previousMouseY = 0;

window.addEventListener('mousedown', (event) => {
    isDragging = true;
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

window.addEventListener('mousemove', (event) => {
    if (isDragging) {
        let deltaX = event.clientX - previousMouseX;
        let deltaY = event.clientY - previousMouseY;

        const rotationSpeed = 0.002;
        camera.rotation.y -= deltaX * rotationSpeed;
        camera.rotation.x -= deltaY * rotationSpeed;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));

        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    }
});

// Export movement data for use in main.js
export { movement };
