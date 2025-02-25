import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true; // Enable WebXR
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

//  1. InstancedMesh for performance
const count = 100000; // 100K cubes for performance (increase if needed)
const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const material = new THREE.MeshNormalMaterial();
const mesh = new THREE.InstancedMesh(geometry, material, count);
scene.add(mesh);

//  2. Assign each cube a unique index
const indexMap = new Map();
const dummy = new THREE.Object3D();
for (let i = 0; i < count; i++) {
    dummy.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50
    );
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    indexMap.set(i, i + 1); // Assign index 1 to 1M (or 100K)
}
mesh.instanceMatrix.needsUpdate = true;

//  3. Raycasting to Detect Clicks on Cubes
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObject(mesh);

  if (intersects.length > 0) {
      const instanceId = intersects[0].instanceId; // Get clicked instance ID
      if (instanceId !== undefined) {
          console.log(`Clicked Cube Index: ${instanceId + 1}`);
      }
  }
});


//  4. Keyboard Navigation (Move Forward/Backward, Left/Right)
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

//  5. Mouse Drag Rotation
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
        scene.rotation.y += deltaX * 0.005;
        scene.rotation.x += deltaY * 0.005;
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    }
});

//  6. VR Controller Clicks
const controller = renderer.xr.getController(0);
controller.addEventListener('selectstart', () => {
    camera.position.z -= 0.5; // Move forward in VR when trigger is pressed
});
scene.add(controller);

//  7. Animation Loop
function animate() {
    renderer.setAnimationLoop(() => {
        // Move forward/backward
        const forwardVector = new THREE.Vector3();
        camera.getWorldDirection(forwardVector);
        camera.position.addScaledVector(forwardVector, movement.forward * movementSpeed);

        // Move left/right
        const rightVector = new THREE.Vector3();
        rightVector.crossVectors(camera.up, forwardVector);
        camera.position.addScaledVector(rightVector, movement.right * movementSpeed);

        renderer.render(scene, camera);
    });
}

animate();
