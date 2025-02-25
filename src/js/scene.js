import { Scene } from 'three/src/scenes/Scene.js';
import { Color } from 'three/src/math/Color.js';
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera.js';
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js';
import { HemisphereLight } from 'three/src/lights/HemisphereLight.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


export const scene = new Scene();
scene.background = new Color('#050505');

export const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 3.5);
// export const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.z = 400;

export const renderer = new WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = false;
controls.enableRotate = false;
controls.enablePan = false;
controls.enableZoom = false;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI;

const CONFIG = {
    hemisphereLight: {
        skyColor: 0xffffff,
        groundColor: 0x444444,
        intensity: 1.6,
        positionY: 200,
    },
};
const hemisphereLight = new HemisphereLight(
    CONFIG.hemisphereLight.skyColor,
    CONFIG.hemisphereLight.groundColor,
    CONFIG.hemisphereLight.intensity
);
hemisphereLight.position.set(0, CONFIG.hemisphereLight.positionY, 0);
scene.add(hemisphereLight);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
