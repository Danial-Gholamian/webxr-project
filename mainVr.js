import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

// 1️⃣ Create Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 0); // Eye level in VR

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

// 2️⃣ Add a 360° Skybox
const skyboxTexture = new THREE.TextureLoader().load('your-360-image.jpg'); // Replace with real 360° image
const skybox = new THREE.Mesh(
    new THREE.SphereGeometry(100, 32, 32),
    new THREE.MeshBasicMaterial({ map: skyboxTexture, side: THREE.BackSide })
);
scene.add(skybox);

// 3️⃣ Generate 100 Selectable Cubes
const cubes = [];
const cubeGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff]; // Different colors

for (let i = 0; i < 100; i++) {
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: colors[i % colors.length] });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

    // Position cubes randomly in a 5-meter radius
    cube.position.set(
        (Math.random() - 0.5) * 5,
        Math.random() * 2 + 1, // Avoid ground level
        (Math.random() - 0.5) * 5
    );

    scene.add(cube);
    cubes.push(cube);
}

// Add lighting so cubes look better
const light = new THREE.PointLight(0xffffff, 1, 10);
light.position.set(0, 3, 0);
scene.add(light);

// 4️⃣ Raycaster for Selection (Works with Mouse & VR)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function selectCube(intersects) {
    if (intersects.length > 0) {
        const selectedCube = intersects[0].object;
        selectedCube.material.color.set(0xffffff); // Change to white when selected
    }
}

// Mouse click selection
window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubes);
    selectCube(intersects);
});

// 5️⃣ VR Controllers for Selection
const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
scene.add(controller1);
scene.add(controller2);

// Handle VR controller selection
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

// 6️⃣ Movement Controls (WASD & VR Thumbsticks)
const movement = { forward: 0, right: 0 };
const movementSpeed = 0.1;

// Keyboard movement logic (WASD)
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

// 7️⃣ VR Thumbstick Movement
function handleJoystickInput(xrFrame) {
    const session = xrFrame.session;

    for (const source of session.inputSources) {
        if (!source.gamepad) continue;

        const handedness = source.handedness;
        const { axes } = source.gamepad;

        if (axes.length < 2) continue; // Ensure valid input

        if (handedness === "right") { // Right controller for movement
            movement.forward = -axes[1]; // Forward/backward
            movement.right = axes[0]; // Left/right

            if (Math.abs(axes[1]) < 0.1) movement.forward = 0; // Stop forward/backward when centered
            if (Math.abs(axes[0]) < 0.1) movement.right = 0; // Stop left/right when centered
        }
    }
}

// 8️⃣ Animation Loop with Movement Logic
function animate() {
    renderer.setAnimationLoop((time, xrFrame) => {
        if (xrFrame) handleJoystickInput(xrFrame);

        // Apply movement each frame
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0; // Keep movement horizontal

        const right = new THREE.Vector3();
        right.crossVectors(camera.up, forward);

        camera.position.addScaledVector(forward, movement.forward * movementSpeed);
        camera.position.addScaledVector(right, movement.right * movementSpeed);

        renderer.render(scene, camera);
    });
}

animate();
