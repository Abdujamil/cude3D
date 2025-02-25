import {
    TextureLoader,
    EquirectangularReflectionMapping,
    DoubleSide,
    MeshPhysicalMaterial,
    Quaternion,
    Euler
} from 'three/src/Three.js';
// import {planeExport, planeLanguages, planeSecurity} from "./sides/index.js";
import {CSS3DObject} from "three/addons/renderers/CSS3DRenderer.js";
import {scene} from "./scene.js";

export async function loadEnvironment() {
    const textureLoader = new TextureLoader();
    try {
        const envMap = await textureLoader.loadAsync(
            "./img/overcast.webp"
        );
        envMap.mapping = EquirectangularReflectionMapping;
        scene.environment = envMap;
    } catch (error) {
        console.error("Ошибка загрузки карты окружения:", error);
    }
}

export function addPlanesToCube(cubeObject) {
    // Корректировка позиции плоскостей в зависимости от масштаба куба
    // const halfScaleY = cubeObject.scale.y / 36;
    // planeExport.position.y = -halfScaleY + 0.0280;
    // planeExport.position.x = -0.890;
    // planeExport.rotation.y = -Math.PI / 2;
    // cubeObject.add(planeExport);
    //
    // planeLanguages.position.y = -halfScaleY + 0.0280;
    // planeLanguages.position.x = 0.890;
    // planeLanguages.rotation.y = Math.PI / 2;
    // cubeObject.add(planeLanguages);
    //
    // planeSecurity.position.y = -halfScaleY + 0.0280;
    // planeSecurity.position.z = 0.902;
    // cubeObject.add(planeSecurity);

    const contentHTML = {
        "front-content": `
        <div style="width: 100%;  height: 100%; background: center center no-repeat; background-size: cover;">
            <h2>Первая сторона</h2>
            <img style="width: 120px; height: 120px;" src="/img/microphone.webp" alt="microphone">
        </div>`,
        "back-content": `
        <div style="width: 200px;  height: 200px; color: #ffffff; background: url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoFRQjM-wM_nXMA03AGDXgJK3VeX7vtD3ctA&s') center center no-repeat; background-size: cover;">
            <h2>Вторая сторона</h2>
        </div>`,
        "left-content": `
        <div style="width: 200px;  height: 200px; color: #ffffff; background: url('https://static.vecteezy.com/ti/photos-gratuite/p1/29360891-une-petit-vert-lezard-seance-sur-haut-de-une-arbre-bifurquer-generatif-ai-gratuit-photo.jpg') center center no-repeat; background-size: cover;">
            <h2>Третья сторона</h2>
        </div>`,
        "right-content": `
        <div style="width: 200px;  height: 200px; color: #ffffff; background: url('https://static.vecteezy.com/ti/photos-gratuite/t1/2253951-gros-plan-d-un-cameleon-sur-une-branche-photo.jpg') center center no-repeat; background-size: cover;">
            <h2>Четвертая сторона</h2>
        </div>`
    };

    const createPlane = (contentId, width, height) => {
        const div = document.createElement('div');
        div.innerHTML = contentHTML[contentId];
        div.style.width = `${width}px`;
        div.style.height = `${height}px`;
        div.style.background = 'rgba(255, 255, 255, 0.8)';
        div.style.border = '1px solid black';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.fontSize = '20px';
        div.innerHTML = contentId;

        return new CSS3DObject(div);
    };

    // Размеры HTML-элемента (настраивай под размер куба)
    const width = 200, height = 200;

    // Создаем 4 стороны
    const planeFront = createPlane('Front', width, height);
    planeFront.position.set(0, 0, 1.01); // Чуть перед кубом

    const planeBack = createPlane('Back', width, height);
    planeBack.position.set(0, 0, -1.01);
    planeBack.rotation.y = Math.PI; // Разворачиваем

    const planeLeft = createPlane('Left', width, height);
    planeLeft.position.set(-1.01, 0, 0);
    planeLeft.rotation.y = Math.PI / 2;

    const planeRight = createPlane('Right', width, height);
    planeRight.position.set(1.01, 0, 0);
    planeRight.rotation.y = -Math.PI / 2;

    // Добавляем к сцене
    cubeObject.add(planeFront, planeBack, planeLeft, planeRight);
}

// export function applyDefaultMaterial(model) {
//     const defaultMaterial = new MeshPhysicalMaterial({
//         color: 0x000000,
//         reflectivity: 0,
//         metalness: 0,
//         roughness: 0.4,
//         side: DoubleSide,
//         transparent: false,
//         opacity: 1,
//     });
//
//     model.traverse((child) => {
//         if (child.isMesh) {
//             child.material = defaultMaterial;
//         }
//     });
// }
export function applyDefaultMaterial(model) {
    model.traverse((child) => {
        if (child.isMesh) {
            child.material.color.set(0x000000);
        }
    });
}

const initialQuaternion = new Quaternion();

export function getRotationPercentage(cube) {
    //Получаем текущий кватернион
    const currentQuaternion = cube.quaternion;

    //Вычисляем угол между текущим и исходным кватернионами
    let angle = initialQuaternion.angleTo(currentQuaternion);

    // Находим угол вращения вокруг оси Y
    const euler = new Euler().setFromQuaternion(currentQuaternion, 'YXZ');
    angle = euler.y;

    // Приводим угол в диапазон 0-2π
    angle = angle % (2 * Math.PI);
    if (angle < 0) {
        angle += 2 * Math.PI;
    }

    // Масштабируем угол в процентное значение
    let percentage = Math.ceil((angle / (2 * Math.PI)) * 100);

    [0, 25, 75, 100].forEach(num => {
        if (Math.abs(percentage - num) <= 1.5) {
            percentage = num
        }
    })

    return percentage
}