import * as THREE from 'three';
import { scene, camera, cubes } from './cubes.js';

// 1️ Raycaster for Mouse Selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function selectCube(intersects) {
    if (intersects.length > 0) {
        const selectedCube = intersects[0].object;
        selectedCube.material.color.set(0xffffff); // Change to white when selected
    }
}

// 2️ Mouse Click Selection
window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubes);
    selectCube(intersects);
});

// 3️ Keyboard Controls for Camera Movement
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

// 4️ Animation Loop for Movement
function updateCameraMovement() {
    const forwardVector = new THREE.Vector3();
    camera.getWorldDirection(forwardVector);
    camera.position.addScaledVector(forwardVector, movement.forward * movementSpeed);

    const rightVector = new THREE.Vector3();
    rightVector.crossVectors(camera.up, forwardVector);
    camera.position.addScaledVector(rightVector, movement.right * movementSpeed);

    requestAnimationFrame(updateCameraMovement);
}
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

        // Rotate camera
        const rotationSpeed = 0.002;
        camera.rotation.y -= deltaX * rotationSpeed; // Rotate left/right
        camera.rotation.x -= deltaY * rotationSpeed; // Rotate up/down

        // Prevent the camera from flipping upside down
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));

        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    }
});

updateCameraMovement();
