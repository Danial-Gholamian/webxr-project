import * as THREE from 'three';
import { scene, camera, cubes } from './cubes.js';

// 1 Raycaster for Mouse Selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedCube = null; // Store the selected cube globally

function selectCube(intersects) {
    if (intersects.length > 0) {
        if (selectedCube) {
            selectedCube.material.color.set(0xff0000); // Reset previous cube color
        }

        selectedCube = intersects[0].object;
        selectedCube.material.color.set(0xffffff); // Highlight selected cube
    }
}

// 2 Mouse Click Selection
window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubes);
    selectCube(intersects);
});

// 3 Keyboard Controls for Camera Movement
const movementSpeed = 0.1;
const movement = { forward: 0, right: 0 };

window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'w': case 'ArrowUp': movement.forward = 1; break;
        case 's': case 'ArrowDown': movement.forward = -1; break;
        case 'a': case 'ArrowLeft': movement.right = -1; break;
        case 'd': case 'ArrowRight': movement.right = 1; break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'w': case 'ArrowUp': case 's': case 'ArrowDown': movement.forward = 0; break;
        case 'a': case 'ArrowLeft': case 'd': case 'ArrowRight': movement.right = 0; break;
    }
});

// 4️⃣ Animation Loop for Movement
function updateCameraMovement() {
    const forwardVector = new THREE.Vector3();
    camera.getWorldDirection(forwardVector);
    forwardVector.y = 0; // Prevent vertical drift
    forwardVector.normalize();

    const rightVector = new THREE.Vector3();
    rightVector.crossVectors(camera.up, forwardVector).normalize();

    camera.position.addScaledVector(forwardVector, movement.forward * movementSpeed);
    camera.position.addScaledVector(rightVector, movement.right * movementSpeed);

    requestAnimationFrame(updateCameraMovement);
}

// 5 Mouse Drag Rotation
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
        const euler = new THREE.Euler(
            camera.rotation.x - deltaY * rotationSpeed,
            camera.rotation.y - deltaX * rotationSpeed,
            0,
            'YXZ'
        );

        // Prevent flipping upside down
        euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));

        camera.quaternion.setFromEuler(euler);

        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    }
});

// 6️
//  Start Movement Animation
updateCameraMovement();
