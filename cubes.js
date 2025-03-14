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

//5 Raycasting for Cube Selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    // Convert mouse position to normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubes);

    if (intersects.length > 0) {
        const selectedCube = intersects[0].object;
        const index = selectedCube.userData.index;

        // 🔹 Change text label to "Clicked: <index>"
        labels[index].material.map.image.getContext('2d').clearRect(0, 0, 128, 64);
        labels[index].material.map.image.getContext('2d').fillText(`Clicked: ${index}`, 32, 32);
        labels[index].material.map.needsUpdate = true;
    }
});

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
