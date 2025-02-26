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
const skyboxTexture = new THREE.TextureLoader().load('background.webp');
const skybox = new THREE.Mesh(
    new THREE.SphereGeometry(100, 32, 32),
    new THREE.MeshBasicMaterial({ map: skyboxTexture, side: THREE.BackSide })
);
scene.add(skybox);

// 3️ Generate Selectable Cubes in a Structured Way
export const cubes = [];
const cubeGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff]; // Different colors

const numCubes = 100;
const amplitude = 3;  // Height of sine wave
const spacing = 0.5;  // Distance between cubes
const radius = 5;     // Spiral radius

for (let i = 0; i < numCubes; i++) {
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: colors[i % colors.length] });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

    // 🎯 Uncomment ONE of the following patterns:

    // 1️ **Sine Wave Pattern** (x moves linearly, y follows sin wave)
    // cube.position.set(i * spacing - (numCubes * spacing) / 2, Math.sin(i * 0.2) * amplitude, 0);

    // 2️ **Helix (Spiral) Pattern** (Cylindrical 3D spiral)
    const theta = i * 0.2; // Angle increases per cube
    cube.position.set(radius * Math.cos(theta), i * 0.1, radius * Math.sin(theta)); // x, y, z

    // 3️ **Circle Formation**
    // const theta = (i / numCubes) * Math.PI * 2;
    // cube.position.set(radius * Math.cos(theta), 1, radius * Math.sin(theta));

    scene.add(cube);
    cubes.push(cube);
}

// 4️ Add Lighting
const light = new THREE.PointLight(0xffffff, 1, 10);
light.position.set(0, 3, 0);
scene.add(light);

// 5️ Animation Loop
export function animate() {
    renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
    });
}
animate();
