import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';
import {GammaCorrectionShader} from 'three/addons/shaders/GammaCorrectionShader.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';


import {GUI} from 'lil-gui';
import {planeExport, planeLanguages, planePhone, planeSecurity, updateTexture} from '../src/js/sides/index.js'

window.addEventListener('DOMContentLoaded', () => {
    // Main scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050505');
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.enableRotate = false;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;

    // Initial camera position
    camera.position.set(0, 1, 3);
    camera.lookAt(0, 0, 0);


    // Array of rotations for each side (front, right, back, left, top, bottom)


    let currentSide = 0; // Start with front
    let isAnimating = false; // Animation flag
    let animationProgress = 0;
    let animationStartTime;
    let startRotation;
    let targetRotation;
    let targetRotationY = 0;
    const duration = 1000; // Animation duration in milliseconds

    // Settings
    const settings = {
        animationDuration: duration,
        chamferSize: 0.02,
        rotationSmoothness: 1,
        cameraDistance: 3,
        scaleSmall: 0.98,
        scaleDuration: 200,
        timeWater: 120.0,
        darkWater: 0.05,
        distortionScale: 0.2
    };

    let isDragging = false;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Mouse down handler
    renderer.domElement.addEventListener('mousedown', (event) => {


        // Convert mouse coordinates to normalized device coordinates (-1 to +1)
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects([cube]);
        if (intersects.length > 0) {
            animateScale(settings.scaleSmall)
            isDragging = true;
            lastMousePosition = {x: event.clientX, y: event.clientY};


        }
    });
    let wheelTimeout = null

    const deltaMove = {
        x: 0
    };


    renderer.domElement.addEventListener('wheel', (event) => {
        // Предотвращаем стандартное поведение (например, прокрутку страницы)
        event.preventDefault();

        // animateScale(settings.scaleSmall);
        // if (wheelTimeout) {
        //     clearTimeout(wheelTimeout);
        //     wheelTimeout = null;
        // }
        // wheelTimeout = setTimeout(() => {
        //     animateScale(1);
        // }, 300);

        inertia = false
        rotationVelocity = 0

        const sensitivity = 0.01; // Чувствительность прокрутки
        const rotationSpeed = 0.1; // Скорость вращения
        const maxRotationSpeed = 0.5;

        // Направление вращения
        const deltaMoveY = event.deltaY * sensitivity;

        // Устанавливаем целевое значение для вращения
        targetRotationY = currentRotationY + deltaMoveY * rotationSpeed;

        cube.rotation.y = targetRotationY
        currentRotationY = targetRotationY

    });

    let rotationVelocity = 0;
    let lastMousePosition = {x: 0, y: 0};
    let inertia = false;
    let currentRotationY = 0; // Store current rotation angle
    let dragStartTime = 0
    // Mouse move handler
    renderer.domElement.addEventListener('mousemove', (event) => {

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([cube]);

        if (intersects.length === 0) {
            renderer.domElement.style.cursor = 'default';
        } else {
            renderer.domElement.style.cursor = 'pointer';
        }

        if (!isDragging) return


        deltaMove.x = Math.min(event.clientX - lastMousePosition.x, 30)

        lastMousePosition = {x: event.clientX, y: event.clientY};

        const sensitivity = 0.5;
        const rotationSpeed = 0.001;

        targetRotationY = 150 * 1.8 * rotationSpeed * sensitivity * Math.sign(deltaMove.x);

        if (!inertia || Math.sign(rotationVelocityAdd) !== Math.sign(deltaMove.x)) {
            rotationVelocityAdd = 0.01 * Math.sign(deltaMove.x)
        }

        rotationVelocity = targetRotationY;

        dragStartTime = performance.now();
        inertia = true;

    });

    // Mouse up and leave handlers
    const stopDragging = (event) => {
        animateScale(1);
        isDragging = false;

    };
    const fog = new THREE.Fog(0x050505, 3, 15);
    scene.fog = fog;

    renderer.domElement.addEventListener('mouseup', stopDragging);

    // Function to create a chamfered cube using ExtrudeGeometry
    function createChamferedCube(size, bevelSize) {
        const halfSize = size.x / 2;
        const shape = new THREE.Shape();

        // --- Отрисовка контура прямоугольника со скошенными углами ---
        shape.moveTo(halfSize - bevelSize, halfSize - bevelSize);

        // 1. Линия от верхней правой точки со скосом до верхней правой точки.
        shape.lineTo(halfSize, halfSize - bevelSize * 2); //Верхняя правая грань

        // 2. Линия от верхней правой точки до нижней правой точки.
        shape.lineTo(halfSize, -halfSize + bevelSize * 2); //Правая грань

        // 3. Линия от нижней правой точки до нижней правой точки со скосом.
        shape.lineTo(halfSize - bevelSize, -halfSize + bevelSize); //Нижняя правая грань

        // 4. Линия от нижней правой точки со скосом до нижней левой точки со скосом.
        shape.lineTo(-halfSize + bevelSize, -halfSize + bevelSize); //Нижняя левая грань

        // 5. Линия от нижней левой точки со скосом до нижней левой точки.
        shape.lineTo(-halfSize, -halfSize + bevelSize * 2); //Нижняя левая грань

        // 6. Линия от нижней левой точки до верхней левой точки.
        shape.lineTo(-halfSize, halfSize - bevelSize * 2); //Левая грань

        // 7. Линия от верхней левой точки до верхней левой точки со скосом.
        shape.lineTo(-halfSize + bevelSize, halfSize - bevelSize); //Верхняя левая грань

        // 8. Замыкаем контур, возвращаясь к исходной верхней правой точке со скосом.
        shape.lineTo(halfSize - bevelSize, halfSize - bevelSize);

        const extrudeSettings = {
            steps: 1,
            depth: size.z,
            bevelEnabled: true,
            bevelThickness: bevelSize,
            bevelSize: bevelSize,
            bevelOffset: 0,
            bevelSegments: 1

        };
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.rotateX(Math.PI / 2); // Rotate to correct orientation
        geometry.computeVertexNormals(); // Ensure proper normals are computed
        return geometry;
    }

    async function loadEnvironment() {
        const textureLoader = new THREE.TextureLoader();
        try {
            const envMap = await textureLoader.loadAsync(
                "/assets/img/overcast.jpg"
            );
            envMap.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = envMap;
        } catch (error) {
            console.error("Ошибка загрузки карты окружения:", error);
        }
    }

    loadEnvironment()

    const CONFIG = {
        hemisphereLight: {
            skyColor: 0xffffff,
            groundColor: 0x444444,
            intensity: 1.6,
            positionY: 200,
        },
    };
    const hemisphereLight = new THREE.HemisphereLight(
        CONFIG.hemisphereLight.skyColor,
        CONFIG.hemisphereLight.groundColor,
        CONFIG.hemisphereLight.intensity
    );

    hemisphereLight.position.set(0, CONFIG.hemisphereLight.positionY, 0);
    scene.add(hemisphereLight);

    // const cubeSize = new THREE.Vector3();
    const cubeSize = new THREE.Vector3(1.6, 1.6, 0.96);
    const geometry = createChamferedCube(cubeSize, settings.chamferSize);

    const material = new THREE.MeshPhysicalMaterial({
        color: 0x00000,
        reflectivity: 0,
        metalness: 0,
        roughness: 0.4,
        side: THREE.DoubleSide,
        transparent: false,
        opacity: 1,
    });

    const cube = new THREE.Mesh(geometry, material);
    cube.rotation.set(0, 0, 0);
    cube.position.y = 0.53;

    //----------------- New code -------------------//
    const params = {
        earthScale: 4.25,
    };
    const materialEarthParams = {
        // color: "#2e363e",
        color: "#ffffff",
        opacity: 0,
        metalness: .4,
        roughness: 1,
        ior: 1,
        envMapIntensity: 5,
        toneMappingExposure: 5,

        // no params in data
        transmission: 0,
        thickness: 0,
        specularIntensity: 0,
        specularColor: "#000000",
        lightIntensity: 6.6,
        exposure: 2.5,
        transmissionResolutionScale: .76
    };

    let pivot, model, earth, border;
    let currentMaterial = 6;

    // 6. Создаём пустой контейнер (pivot) для вращения модели
    pivot = new THREE.Object3D();
    // cube.position.y = -0.00;
    cube.add(pivot);

    // 7. Библиотека материалов
    const materials = [
        new THREE.MeshStandardMaterial({color: 0x3498db}), // Синий
        new THREE.MeshStandardMaterial({color: 0xff5733}), // Красный
        new THREE.MeshStandardMaterial({color: 0x2ecc71})  // Зелёный
    ];

    const sharedMaterialParams = {
        color: `#${materials[0].color.getHexString()}`,
        hue: materials[0].color.getHSL({}).h * 360,
        saturation: materials[0].color.getHSL({}).s,
        lightness: materials[0].color.getHSL({}).l
    };

    // Функция обновления всех материалов
    function updateMaterials() {
        materials.forEach((material) => {
            const hsl = material.color.getHSL({});
            material.color.setHSL(sharedMaterialParams.hue / 360, sharedMaterialParams.saturation, sharedMaterialParams.lightness);
            material.needsUpdate = true;
        });
    }

    // Функция обновления материала Земли
    function applyMaterialSettings() {
        if (!earth || !earth.material) return;

        earth.material.color.set(materialEarthParams.color);
        earth.material.opacity = materialEarthParams.opacity;
        earth.material.metalness = materialEarthParams.metalness;
        earth.material.roughness = materialEarthParams.roughness;
        earth.material.ior = materialEarthParams.ior;
        earth.material.envMapIntensity = materialEarthParams.envMapIntensity;
        earth.material.toneMappingExposure = materialEarthParams.toneMappingExposure;

        earth.material.transmission = materialEarthParams.transmission;
        earth.material.thickness = materialEarthParams.thickness;
        earth.material.specularIntensity = materialEarthParams.specularIntensity;
        earth.material.specularColor.set(materialEarthParams.specularColor);
        earth.material.lightIntensity = materialEarthParams.lightIntensity;
        earth.material.exposure = materialEarthParams.exposure;
        earth.material.transmissionResolutionScale = materialEarthParams.transmissionResolutionScale;

        earth.material.needsUpdate = true;  // 💡 ВАЖНО: Обновляем материал
    }

    function generateTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 2;

        const context = canvas.getContext('2d');
        context.fillStyle = 'white';
        // context.fillRect(0, 1, 2, 1);
        context.fillRect(0, 0, 2, 2);
        return canvas;
    }

    function addPlanesToCube(cubeObject) {
        // Корректировка позиции плоскостей в зависимости от масштаба куба
        const halfScaleY = cubeObject.scale.y / 2;

        planeExport.position.y = -halfScaleY + 0.02;
        planeExport.position.x = -0.825;
        planeExport.rotation.y = -Math.PI / 2;
        cubeObject.add(planeExport);

        planeLanguages.position.y = -halfScaleY + 0.02;
        planeLanguages.position.x = 0.825;
        planeLanguages.rotation.y = Math.PI / 2;
        cubeObject.add(planeLanguages);

        planeSecurity.position.y = -halfScaleY + 0.02;
        planeSecurity.position.z = 0.802;
        cubeObject.add(planeSecurity);
    }

    // 8. Функция загрузки модели
    function loadModel(modelPath, scaleFactor = 7) {
        if (model) {
            pivot.remove(model); // Удаляем предыдущую модель
        }

        const loaderGLTF = new GLTFLoader();
        loaderGLTF.load(
            `models/${modelPath}`,
            (gltf) => {
                model = gltf.scene;
                console.log(model);
                if (!model) {
                    console.error("❌ Ошибка: Модель не загружена!");
                    return;
                }


                // Ищем сам куб в модели
                const cubeObject = model.getObjectByName("Куб") || model.children[0];// Если имени нет, берем всю модель

                // cubeObject.scale.set(scaleFactor, 8, scaleFactor);
                cubeObject.scale.set(1, 1, 1);

                addPlanesToCube(cubeObject);

                // Добавляем модель в pivot
                pivot.add(model);

                console.log(`✅ Модель ${modelPath} загружена и материал применён!`);
            },
            undefined,
            (error) => {
                console.error(`Ошибка загрузки модели ${modelPath}:`, error);
            }
        );
    }

    // 9. Выбор модели из списка
    document.getElementById("modelSelect").addEventListener("change", (event) => {
        const selectedModel = event.target.value;
        loadModel(selectedModel);
    });
    // 10. Функция смены материала
    document.getElementById("changeMaterial").addEventListener("click", () => {
        if (model) {
            currentMaterial = (currentMaterial + 1) % materials.length;

            model.traverse((child) => {
                if (child.isMesh && child !== earth && child !== border) {
                    child.material = materials[currentMaterial];
                }
            });

            console.log(`Материал изменён на ${currentMaterial}`);
        }
    });

    // 13. Загружаем первую модель при запуске
    loadModel("cube_bevel_0.1.gltf");

    //----------------- End New code -------------------//


    // planeExport.position.y = -cube.scale.y / 2 + 0.02
    // planeExport.position.x = -0.825
    // planeExport.rotation.y = -Math.PI / 2;
    // cube.add(planeExport)
    //
    // planeLanguages.position.y = -cube.scale.y / 2 + 0.02
    // planeLanguages.position.x = 0.825
    // planeLanguages.rotation.y = Math.PI / 2;
    // cube.add(planeLanguages)
    //
    // planeSecurity.position.y = -cube.scale.y / 2 + 0.02
    // planeSecurity.position.z = 0.802
    // cube.add(planeSecurity)

    scene.add(cube);


    // Inner cube

    const baseScale = 1;
    let isScaling = false
    let interactionScale = 1;
    let scaleFrom = 1;
    let scaleToValue = 1;
    let scaleStartTime = 0;

    cube.scale.setScalar(baseScale * interactionScale);

    // Floor
    // const floorGeometry = new THREE.PlaneGeometry(2, 2);

    // const floor = new Reflector(floorGeometry, {
    //     color: new THREE.Color(0x7f7f7f),
    //     textureWidth: window.innerWidth * window.devicePixelRatio / 2,
    //     textureHeight: window.innerHeight * window.devicePixelRatio / 2,
    // })

    // floor.rotation.x = -Math.PI / 2;
    // floor.position.y = -0.7;
    // floor.position.z = 1;
    // scene.add(floor);


    // Post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    const fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = renderer.getPixelRatio();
    fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
    fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
    composer.addPass(fxaaPass);
    const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
    composer.addPass(ssaoPass);
    const gammaPass = new ShaderPass(GammaCorrectionShader);
    composer.addPass(gammaPass);


    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        ssaoPass.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });


    // GUI controls
    const gui = new GUI();

    //----------------- Настройки материалов -------------------//
    const materialsFolder = gui.addFolder("Настройки материалов");

    materialsFolder.addColor(sharedMaterialParams, 'color')
        .name('Цвет')
        .onChange((value) => {
            materials.forEach((material) => {
                material.color.set(value);
                material.needsUpdate = true;
            });
        });

    materialsFolder.add(sharedMaterialParams, 'hue', 0, 360, 1)
        .name('Оттенок')
        .onChange(updateMaterials);

    materialsFolder.add(sharedMaterialParams, 'saturation', 0, 1, 0.01)
        .name('Насыщенность')
        .onChange(updateMaterials);

    materialsFolder.add(sharedMaterialParams, 'lightness', 0, 1, 0.01)
        .name('Яркость')
        .onChange(updateMaterials);

    materialsFolder.open();

    const cubeSettings = {
        'Цвет куба': material.color.getHex(),
        'Прозрачность': material.opacity,
        'Отражение': material.reflectivity,
        'Металличность': material.metalness,
        'Шероховатость': material.roughness,
        'Размер фаски': settings.chamferSize,
        'Стиль стекла': 'Обычное',
    };

    const scrollSettings = {
        'Длительность анимации': settings.animationDuration,
        'Плавность поворота': settings.rotationSmoothness,
        'Отдаление камеры': settings.cameraDistance,
        'Степень уменьшения': settings.scaleSmall,
        'Плавность уменьшения': settings.scaleDuration,
    };


    const scrollFolder = gui.addFolder('Общие');
    scrollFolder.add(scrollSettings, 'Длительность анимации', 100, 1000)
        .onChange(() => {
            settings.animationDuration = scrollSettings['Длительность анимации'];
        });
    scrollFolder.add(scrollSettings, 'Плавность поворота', 0, 1)
        .onChange(() => {
            settings.rotationSmoothness = scrollSettings['Плавность поворота'];
        });
    scrollFolder.add(scrollSettings, 'Отдаление камеры', 2, 10)
        .onChange(() => {
            settings.cameraDistance = scrollSettings['Отдаление камеры'];
            camera.position.set(0, 0, settings.cameraDistance);
        });

    scrollFolder.add(scrollSettings, 'Степень уменьшения', 0, 1)
        .onChange(() => {
            settings.scaleSmall = scrollSettings['Степень уменьшения'];
        });

    scrollFolder.add(scrollSettings, 'Плавность уменьшения', 100, 1000)
        .onChange(() => {
            settings.scaleDuration = scrollSettings['Плавность уменьшения'];
        });


    const cubeFolder = gui.addFolder('Внешний куб');
    cubeFolder.addColor(cubeSettings, 'Цвет куба')
        .onChange(() => {
            cube.material.color.set(cubeSettings['Цвет куба']);
        });
    cubeFolder.add(cubeSettings, 'Прозрачность', 0, 1)
        .onChange(() => {
            cube.material.opacity = cubeSettings['Прозрачность'];
        });
    cubeFolder.add(cubeSettings, 'Отражение', 0, 1)
        .onChange(() => {
            cube.material.reflectivity = cubeSettings['Отражение'];
        });
    cubeFolder.add(cubeSettings, 'Металличность', 0, 1)
        .onChange(() => {
            cube.material.metalness = cubeSettings['Металличность'];
        });
    cubeFolder.add(cubeSettings, 'Шероховатость', 0, 1)
        .onChange(() => {
            cube.material.roughness = cubeSettings['Шероховатость'];
        });
    cubeFolder.add(cubeSettings, 'Размер фаски', 0, 0.1)
        .onChange(() => {
            settings.chamferSize = cubeSettings['Размер фаски'];
            const newGeometry = createChamferedCube(cubeSize, settings.chamferSize);
            cube.geometry.dispose();
            cube.geometry = newGeometry;
            cube.geometry.computeVertexNormals();
        });

    // Animation loop
    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    let rotationVelocityAdd = 0.01

    const animate = () => {

        requestAnimationFrame(animate);
        updateTexture()

        controls.update();
        if (isScaling) {
            let now = performance.now()
            const elapsed = now - scaleStartTime;

            const t = Math.min(elapsed / settings.scaleDuration, 1);
            const eased = easeInOutQuad(t);
            interactionScale = scaleFrom + (scaleToValue - scaleFrom) * eased;
            cube.scale.setScalar(baseScale * interactionScale);
            if (t >= 1) {
                isScaling = false;
            }
        }
        if (inertia) {

            let now = performance.now()
            const time = now - dragStartTime


            if (time < Math.min(1000, Math.abs(10 * deltaMove.x))) {
                if (Math.abs(rotationVelocityAdd) >= Math.abs(rotationVelocity)) {
                    rotationVelocityAdd = rotationVelocity
                } else {
                    rotationVelocityAdd = rotationVelocityAdd * 1.5
                }
            } else {
                rotationVelocityAdd = rotationVelocityAdd * 0.9;
            }

            cube.rotation.y += rotationVelocityAdd;
            cube.geometry.computeVertexNormals();
            currentRotationY = cube.rotation.y;

            if (Math.abs(rotationVelocityAdd) < 0.001) {
                inertia = false;
            }
        }

        if (!isAnimating && !inertia) {
            cube.rotation.y = currentRotationY
            cube.geometry.computeVertexNormals();

        }

        if (isAnimating || inertia) {

            updateNavPosition(true)
        }
        // floor.material.uniforms['time'].value += 1.0 / settings.timeWater;

        composer.render();
    };
    animate();

    function animateScale(toMultiplier) {
        scaleFrom = interactionScale;
        scaleToValue = toMultiplier;
        scaleStartTime = performance.now();
        isScaling = true;
    }

    document.addEventListener('mouseleave', () => {
        isDraggingSlide = false;
        navs.forEach(nav => nav.classList.remove('dragging'));
    });

    const sliderCube = document.querySelector('.slider_cube');
    const navs = document.querySelectorAll('.slider_cube-nav');
    const items = document.querySelectorAll('.slider_cube-item');

    let isDraggingSlide = false;
    let startX = 0;
    let currentX = 0;

    let firstNav = navs[0];
    let secondNav = navs[1];

    const navWidth = firstNav.offsetWidth;
    const gap = sliderCube.offsetWidth - navWidth;

    const initialQuaternion = new THREE.Quaternion();

    function getRotationPercentage(cube) {
        //Получаем текущий кватернион
        const currentQuaternion = cube.quaternion;

        //Вычисляем угол между текущим и исходным кватернионами
        let angle = initialQuaternion.angleTo(currentQuaternion);

        // Находим угол вращения вокруг оси Y
        const euler = new THREE.Euler().setFromQuaternion(currentQuaternion, 'YXZ');
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

    function updateNavPosition(disable = false) {

        if (!disable) {

            const percent = currentX / ((sliderCube.offsetWidth - 12) / 100)
            currentRotationY = (percent / 100) * (Math.PI * 2);

        } else {

            currentX = getRotationPercentage(cube) * ((sliderCube.offsetWidth - 12) / 100)
        }


        if (currentX < -(navWidth + gap / 2)) {
            currentX = -800 > currentX ? currentX + (navWidth + gap) : -300;
            let temp = firstNav;
            firstNav = secondNav;
            secondNav = temp;

        }

        if (currentX > (navWidth + gap / 2)) {
            currentX = 800 > currentX ? currentX - (navWidth + gap) : 300;
            let temp = firstNav;
            firstNav = secondNav;
            secondNav = temp;

        }


        firstNav.style.left = `${currentX}px`;
        secondNav.style.left = `${currentX + navWidth + gap}px`;
        updateItemOpacity();
    }

    function updateItemOpacity() {
        items.forEach(item => {
            const itemLeft = item.offsetLeft;
            let opacity = 0.6;

            const firstNavLeft = firstNav.offsetLeft;
            const secondNavLeft = secondNav.offsetLeft;

            const firstNavRight = firstNavLeft + navWidth;
            const secondNavRight = secondNavLeft + navWidth;


            if (
                (itemLeft > firstNavLeft && itemLeft < firstNavRight) ||
                (itemLeft > secondNavLeft && itemLeft < secondNavRight)
            ) {
                opacity = 1;
            }

            item.style.opacity = opacity;
        });
    }

    navs.forEach(nav => {
        nav.addEventListener('mousedown', (e) => {
            isDraggingSlide = true;
            startX = e.clientX - currentX;
            nav.classList.add('dragging');
        });
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDraggingSlide) return;
        if (inertia) {
            inertia = false;
            rotationVelocity = 0;
        }
        currentX = e.clientX - startX;
        console.log(currentX);

        updateNavPosition();
    });

    document.addEventListener('mouseup', () => {
        isDraggingSlide = false;
        navs.forEach(nav => nav.classList.remove('dragging'));
    });

    updateNavPosition();
})

