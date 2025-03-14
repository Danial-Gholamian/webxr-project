import * as THREE from 'three';

// 1️ Create Scene, Camera, Renderer
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5); // Slightly back to view cubes

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// 2️ Add a 360° Skybox
const skyboxTexture = new THREE.TextureLoader().load('background.webp');
const skybox = new THREE.Mesh(
    new THREE.SphereGeometry(100, 32, 32),
    new THREE.MeshBasicMaterial({ map: skyboxTexture, side: THREE.BackSide })
);
scene.add(skybox);

// 3 Generate 100 Selectable Cubes with Index Labels
export const cubes = [];
export const labels = [];
// const cubeGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
// const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];

// for (let i = 0; i < 1000; i++) {
//     const cubeMaterial = new THREE.MeshStandardMaterial({ color: colors[i % colors.length] });
//     const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
//     cube.userData.index = i; // Store index inside cube metadata

//     // Position cubes in a sine wave pattern
//     const x = (i - 50) * 0.3;
//     const y = Math.sin(i * 0.2) * 2;
//     const z = 0;

//     cube.position.set(x, y, z);
//     scene.add(cube);
//     cubes.push(cube);

//     // 🔹 Create a label (text) above each cube
//     const label = createTextLabel(i.toString()); // Converts index to text
//     label.position.set(x, y + 0.4, z); // Slightly above the cube
//     scene.add(label);
//     labels.push(label);
// }

// // 4 Create a Function to Render Text Labels
// function createTextLabel(text) {
//     const canvas = document.createElement('canvas');
//     const context = canvas.getContext('2d');
//     canvas.width = 128;
//     canvas.height = 64;

//     context.fillStyle = 'rgba(255, 255, 255, 1)'; // White text
//     context.font = '24px Arial';
//     context.fillText(text, 32, 32);

//     const texture = new THREE.CanvasTexture(canvas);
//     const material = new THREE.SpriteMaterial({ map: texture });

//     const sprite = new THREE.Sprite(material);
//     sprite.scale.set(0.5, 0.25, 1); // Adjust size
//     sprite.renderOrder = 1; // Ensures it renders above other objects
//     sprite.userData.isLabel = true; // Mark as a label (ignored by raycaster)

//     return sprite;
// }

//5 Raycasting for Cube Selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// window.addEventListener('click', (event) => {
//     // Convert mouse position to normalized device coordinates (-1 to +1)
//     mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//     mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

//     raycaster.setFromCamera(mouse, camera);
//     const intersects = raycaster.intersectObjects(cubes);

//     if (intersects.length > 0) {
//         const selectedCube = intersects[0].object;
//         const index = selectedCube.userData.index;

//         // 🔹 Change text label to "Clicked: <index>"
//         labels[index].material.map.image.getContext('2d').clearRect(0, 0, 128, 64);
//         labels[index].material.map.image.getContext('2d').fillText(`Clicked: ${index}`, 32, 32);
//         labels[index].material.map.needsUpdate = true;
//     }
// });

// 6 Add Lighting
const light = new THREE.PointLight(0xffffff, 1, 10);
light.position.set(0, 3, 0);
scene.add(light);

// 7 Animation Loop
export function animate() {
    renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
    });
}
animate();
