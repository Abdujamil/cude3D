import {Scene} from 'three/src/scenes/Scene.js';
import {Color} from 'three/src/math/Color.js';
import {PerspectiveCamera} from 'three/src/cameras/PerspectiveCamera.js';
import {WebGLRenderer} from 'three/src/renderers/WebGLRenderer.js';
import {HemisphereLight} from 'three/src/lights/HemisphereLight.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CSS3DRenderer} from "three/addons/renderers/CSS3DRenderer.js";

export const scene = new Scene();
scene.background = new Color('#050505');

export const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.set(0, 0, 3.6);
const dpi = window.devicePixelRatio; // Получаем плотность пикселей

if (window.innerWidth > 2561 || dpi > 1.5) {
    // Для 2K+ мониторов или экранов с высоким DPI (Retina)
    camera.fov = 48;
    camera.position.set(0, 0, 3.8);
} else if (window.innerWidth < 769) {
    // Мобильные устройства
    camera.fov = 60;
    camera.position.set(0, 0, 5);
} else {
    // Full HD и ниже
    camera.fov = 45;
    camera.position.set(0, 0, 3.6);
}

// Обновляем матрицу проекции после изменения FOV
camera.updateProjectionMatrix();
// if (window.innerWidth < 2561) {
//     camera.position.set(0, 0, 3.8);
// } else if (window.innerWidth < 769) {
//     camera.position.set(0, 0, 5); // На мобильных камера дальше
// } else {
//     camera.position.set(0, 0, 3.6); // На десктопе стандартная позиция
// }
// export const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.z = 1600;


// Обертка для WebGL-рендерера
const webGLContainer = document.createElement("div");
webGLContainer.style.position = "absolute";
webGLContainer.style.top = "0";
webGLContainer.style.left = "0";
webGLContainer.style.width = "100%";
webGLContainer.style.height = "100%";
document.body.appendChild(webGLContainer);

export const renderer = new WebGLRenderer({
    antialias: false,
    alpha: true,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
    logarithmicDepthBuffer: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
webGLContainer.appendChild(renderer.domElement);

// HTML-рендерер
const cssContainer = document.createElement("div");
cssContainer.style.position = "absolute";
cssContainer.style.top = "0";
cssContainer.style.left = "0";
cssContainer.style.width = "100%";
cssContainer.style.height = "100%";
cssContainer.style.pointerEvents = "none"; // предотвращает баги с кликами
cssContainer.classList.add("css3d-container");
document.body.appendChild(cssContainer);

export const cssRenderer = new CSS3DRenderer();
// cssRenderer.setPixelRatio(window.devicePixelRatio);
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssContainer.appendChild(cssRenderer.domElement);

export const controls = new OrbitControls(camera, cssRenderer.domElement);
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

function onWindowResize() {
    camera.fov = window.innerWidth < 768 ? 75 : 45;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
    // cssRenderer.setSize(window.innerWidth, window.innerHeight);


    // Перерисовка после ресайза
    cssRenderer.domElement.style.transform = renderer.domElement.style.transform;
}

window.addEventListener("resize", onWindowResize);



