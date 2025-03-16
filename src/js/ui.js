import {GUI} from 'lil-gui';
import {settings} from './config.js';

export function setupGUI(camera, cube) {
    const gui = new GUI();

    // const cubeSettings = {
    //     'Цвет куба': 0x000000,
    //     'Прозрачность': .4,
    //     'Отражение':  0,
    //     'Металличность': 1,
    //     'Шероховатость': .4,
    //     'Размер фаски': 0.04,
    //     'Стиль стекла': 'Обычное',
    // };

    const scrollSettings = {
        'Длительность анимации': settings.animationDuration,
        'Плавность поворота': settings.rotationSmoothness,
        'Отдаление камеры': settings.cameraDistance,
        'Степень уменьшения': settings.scaleSmall,
        'Плавность уменьшения': settings.scaleDuration,
        'Чувс. вращения куба': settings.sensitivity,
        'Скор. вращения куба': settings.rotationSpeed,
    };

    const scrollFolder = gui.addFolder('Общие');
    scrollFolder.add(scrollSettings, 'Отдаление камеры', 2, 15)
        .onChange(() => {
            camera.position.set(0, 0, scrollSettings['Отдаление камеры']);
        });

    // scrollFolder.add(scrollSettings, 'Степень уменьшения', 0, 1)
    //     .onChange(() => {
    //         settings.scaleSmall = scrollSettings['Степень уменьшения'];
    //     });

    // scrollFolder.add(scrollSettings, 'Длительность анимации', 100, 1000)
    //     .onChange(() => {
    //         settings.animationDuration = scrollSettings['Длительность анимации'];
    //     });
    //
    // scrollFolder.add(scrollSettings, 'Плавность поворота', 0, 1)
    //     .onChange(() => {
    //         settings.rotationSmoothness = scrollSettings['Плавность поворота'];
    //     });

    scrollFolder.add(scrollSettings, 'Чувс. вращения куба', 0, 1)
        .onChange(() => {
            settings.sensitivity = scrollSettings['Чувс. вращения куба'];
        });

    scrollFolder.add(scrollSettings, 'Скор. вращения куба', 0, 0.1)
        .onChange(() => {
            settings.rotationSpeed = scrollSettings['Скор. вращения куба'];
        });

    // const cubeFolder = gui.addFolder('Внешний куб');
    //
    // // cubeFolder.add(settings, 'backgroundBlur', 0, 100, 1).onChange(updateBlur);
    //
    // cubeFolder.addColor(cubeSettings, 'Цвет куба')
    //     .onChange(() => {
    //         cube.traverse((child) => {
    //             if (child.isMesh) {
    //                 child.material.color.set(cubeSettings['Цвет куба']);
    //             }
    //         });
    //     });
    //
    // cubeFolder.add(cubeSettings, 'Прозрачность', 0, 1)
    //     .onChange(() => {
    //         cube.traverse((child) => {
    //             if (child.isMesh) {
    //                 child.material.transparent = true;
    //                 child.material.opacity = cubeSettings['Прозрачность'];
    //             }
    //         });
    //     });
    //
    // cubeFolder.add(cubeSettings, 'Отражение', 0, 1)
    //     .onChange(() => {
    //         cube.traverse((child) => {
    //             if (child.isMesh && child.material.isMeshPhysicalMaterial) {
    //                 child.material.reflectivity = cubeSettings['Отражение'];
    //             }
    //         });
    //     });
    //
    // cubeFolder.add(cubeSettings, 'Металличность', 0, 1)
    //     .onChange(() => {
    //         cube.traverse((child) => {
    //             if (child.isMesh) {
    //                 child.material.metalness = cubeSettings['Металличность'];
    //             }
    //         });
    //     });
    //
    // cubeFolder.add(cubeSettings, 'Шероховатость', 0, 1)
    //     .onChange(() => {
    //         cube.traverse((child) => {
    //             if (child.isMesh) {
    //                 child.material.roughness = cubeSettings['Шероховатость'];
    //             }
    //         });
    //     });
}

