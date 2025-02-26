import * as THREE from 'three';

// 1️ Create Scene, Camera, Renderer
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 0); // Eye level in VR

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// 2️ Add a 360° Skybox
const skyboxTexture = new THREE.TextureLoader().load('background.webp'); // Replace with real 360° image
const skybox = new THREE.Mesh(
    new THREE.SphereGeometry(100, 32, 32),
    new THREE.MeshBasicMaterial({ map: skyboxTexture, side: THREE.BackSide })
);
scene.add(skybox);

// 3️ Generate 100 Selectable Cubes
export const cubes = [];
const cubeGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff]; // Different colors

for (let i = 0; i < 100; i++) {
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: colors[i % colors.length] });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

    // Position cubes randomly in a 5-meter radius
    const x = (i - 50) * 0.3; // Spread cubes along X
    const y = Math.sin(i * 0.2) * 2; // Sine wave movement in Y
    const z = 0; // Keep cubes aligned in Z

    cube.position.set(x, y, z);

    scene.add(cube);
    cubes.push(cube);
}

// Add lighting so cubes look better
const light = new THREE.PointLight(0xffffff, 1, 10);
light.position.set(0, 3, 0);
scene.add(light);

// 6️ Export Animation Loop
export function animate() {
    renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
    });
}
animate();
