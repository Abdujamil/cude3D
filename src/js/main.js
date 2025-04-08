import {Raycaster, Vector2, Fog, Object3D, Group, MathUtils} from 'three/src/Three.js';
import {scene, camera, renderer, controls, cssRenderer} from './scene.js';
import {getRotationPercentage, initialQuaternion, loadEnvironment, createFace} from './functions.js';
import {loadModel} from "./modelLoader.js";
import {setupDebug} from "./debug.js";
import {setupPostProcessing} from "./postProcessing.js";
import {settings} from "./config.js";
import $ from "jquery";
import "jquery.easing";
import VanillaTilt from "vanilla-tilt";
import {GUI} from 'lil-gui';

window.addEventListener('DOMContentLoaded', () => {
    // Array of rotations for each side (front, right, back, left, top, bottom)
    let isAnimating = false; // Animation flag
    let targetRotationY = 0;
    const duration = 1000; // Animation duration in milliseconds

    const raycaster = new Raycaster();
    const mouse = new Vector2();

    let isDragging = false;
    let lastMousePosition = {x: 0, y: 0};
    let rotationVelocity = 0;
    let inertia = false;
    let currentRotationY = 0; // Store current rotation angle
    let dragStartTime = 0;

    const deltaMove = {
        x: 0
    };

    const fog = new Fog(0x050505, 3, 15);
    scene.fog = fog;

    // Загрузка image
    loadEnvironment();

    // Создаем куб с HTML-гранями
    const cubeGroup = new Group();
    const facesGroup = new Group();

    // const cube = new THREE.Mesh(geometry, material);
    const cube = new Object3D();
    cube.rotation.set(0, 0, 0);
    cube.position.y = -0.00;
    // cube.position.y = 0.53;

    // Создаем HTML-элементы для граней куба
    let currentFace = null;
    let faces = [];

    const settingPosition = {
        "front": {
            x: 0, y: 0, z: 483.5
        },
        "back": {
            x: 1, y: -1, z: -485
        },
        "left": {
            x: -511, y: -1, z: -1
        },
        "right": {
            x: 510, y: -1, z: 0
        },
    }

    // v-base
    // const positions = [
    //     {x: 0, y: 0, z: 483.5, rx: 0, ry: 0, contentId: "front-content"}, // microphone
    //     {x: 1, y: -1, z: -485, rx: 0, ry: Math.PI, contentId: "back-content"}, //  Export
    //     {x: -511, y: -1, z: -1, rx: 0, ry: -Math.PI / 2, contentId: "left-content"}, // react
    //     {x: 510, y: -1, z: 0, rx: 0, ry: Math.PI / 2, contentId: "right-content"}, // security
    // ];

    // Проверка на iOS и ширину экрана
    // const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    // const isSmallScreen = window.innerWidth < 768;
    //
    // // Альтернативные позиции для iOS мобилок
    // const settingPositionIOSMobile = {
    //     front: {x: 0, y: 0, z: 470},
    //     back: {x: 0, y: -2, z: -470},
    //     left: {x: -500, y: -2, z: 0},
    //     right: {x: 500, y: -2, z: 0},
    // };
    //
    // // Подменяем, если условия сработали
    // if (isIOS && isSmallScreen) {
    //     console.log("iOS mobile detected — applying alt positions");
    //     Object.assign(settingPosition, settingPositionIOSMobile);
    // }

    function generatePositions() {
        return [
            {...settingPosition.front, rx: 0, ry: 0, contentId: "front-content"},
            {...settingPosition.back, rx: 0, ry: Math.PI, contentId: "back-content"},
            {...settingPosition.left, rx: 0, ry: -Math.PI / 2, contentId: "left-content"},
            {...settingPosition.right, rx: 0, ry: Math.PI / 2, contentId: "right-content"},
        ];
    }

    const positions = generatePositions();


    // Создаём GUI
    const gui = new GUI();

    const imageOptions = [
        'microphone1.png',
        'microphone3.png',
        'microphone7.png',
        'microphone-sl.png' // основной
    ];

    const imageSelector = { image: 'microphone3.png' };

    // Устанавливаем по умолчанию картинку и ширину
    document.querySelectorAll('.slider_cube-nav img').forEach(img => {
        img.src = `/img/${imageSelector.image}`;
        if (imageSelector.image === 'microphone-sl.png') {
            img.style.width = '40px';
            img.style.position = 'initial';
        }
    });

    // const imageFolder = gui.addFolder('Images');
    // imageFolder
    //     .add(imageSelector, 'image', imageOptions)
    //     .name('All faces image')
    //     .onChange(filename => {
    //         document.querySelectorAll('.slider_cube-nav img').forEach(img => {
    //             img.src = `/img/${filename}`;
    //             img.style.position = 'absolute';
    //
    //             if (filename === 'microphone-sl.png') {
    //                 img.style.width = '40px';
    //                 img.style.position = 'initial';
    //             } else {
    //                 img.style.width = ''; // сброс к CSS (79px)
    //             }
    //         });
    //     });

    const updatePosition = (key, axis, value) => {
        settingPosition[key][axis] = value;

        const indexMap = {
            front: 0,
            back: 1,
            left: 2,
            right: 3,
        };

        const index = indexMap[key];
        if (positions[index]) {
            positions[index][axis] = value;
        }


        if (faces[index]) {
            faces[index].position[axis] = value;
        }
    };

    Object.entries(settingPosition).forEach(([key, pos]) => {
        const folder = gui.addFolder(key.toUpperCase());
        ['x', 'y', 'z'].forEach(axis => {
            folder
                .add(pos, axis, -1000, 1000)
                .step(1)
                .onChange(value => {
                    updatePosition(key, axis, value);
                });
        });
    });

    // Корректировка позиций для iOS
    // if (isIOS) {
    //     positions = positions.map(({x, y, z, rx, ry, contentId}) => {
    //         // Добавляем корректировки только для iOS
    //         return {
    //             x: x * 1.05, // Корректировка по оси X
    //             y: y * 1.05, // Корректировка по оси Y
    //             z,
    //             rx,
    //             ry,
    //             contentId
    //         };
    //     });
    // }

    //v-2
    // const positions = [
    //     {x: 0, y: 0, z: 484, rx: 0, ry: 0, contentId: "front-content"}, // microphone
    //     {x: 0, y: 0, z: -485, rx: 0, ry: Math.PI, contentId: "back-content"}, // security
    //     {x: -510, y: 0, z: 1, rx: 0, ry: -Math.PI / 2, contentId: "left-content"}, //  Export
    //     {x: 510, y: 0, z: 1, rx: 0, ry: Math.PI / 2, contentId: "right-content"}, // react
    // ];


    // function updateBlur() {
    //     faces.forEach(face => {
    //         face.element.style.backdropFilter = `blur(${settings.backgroundBlur}px)`;
    //         face.element.style.border = `1px solid ${settings.borderColor}`;
    //     });
    // }
    positions.forEach(({x, y, z, rx, ry, contentId}) => {
        const face = createFace(contentId, currentFace, faces); // Используем готовый HTML контент
        face.position.set(x, y, z);
        face.rotation.y = ry;
        face.rotation.x = rx;
        facesGroup.add(face);
    });
    facesGroup.scale.set(0.0017, 0.002, 0.0018);


    // Inner cube
    const baseScale = 1;
    let isScaling = false
    let interactionScale = 1;
    let scaleFrom = 1;
    let scaleStartTime = 0;

    // Загружаем Three.js модули после первого взаимодействия
    let scaleToValue = 1;
    let threeModulesLoaded = false;

    const sliderCube = document.querySelector('.slider_cube');
    // sliderCube.style.display = 'none';
    const navs = document.querySelectorAll('.slider_cube-nav');
    const items = document.querySelectorAll('.slider_cube-item');
    const itemsLink = document.querySelectorAll('.slider_cube-item a');
    itemsLink.forEach(item => {
        item.style.borderRadius = "4px";
        item.style.opacity = "0.6";
    });

    let isDraggingSlide = false;
    let startX = 0;
    let currentX = 0;

    let firstNav = navs[0];
    let secondNav = navs[1];
    secondNav.style.opacity = 0;

    const navWidth = firstNav.offsetWidth;
    const gap = sliderCube.offsetWidth - navWidth;

    // const initialRotation = (90 * Math.PI) / 180; // Переводим градусы в радианы
    // cube.rotation.y = initialRotation;
    // currentRotationY = initialRotation;
    // targetRotationY = initialRotation;

    // loadModel(cube, "cube3.glb");

    // loadMicrophoneModel(cube, "microphone.glb");
    // loadModel(cube, "new_cube.glb");
    // initialQuaternion.copy(cube.quaternion);

    // loadModel(cube, "cube_bevel_0.04_meshopt.glb");
    // loadModel(cube, "cube_bevel_0.04_meshopt.glb");
    //
    // const gui = new GUI();
    // const scrollFolder = gui.addFolder('Задний блюр');
    // scrollFolder.add(settings, "backgroundBlur", 0, 60)
    //     .onChange(() => {
    //         updateBlur();
    //     });
    //
    // const cubeOptions = {
    //     'Куб 3': 'cube3.glb',
    //     'Куб 4': 'cube4.glb',
    //     'Куб (Mesh)': 'cube_bevel_0.04_meshopt.glb'
    // };
    //
    // const cubeSettings = { currentCube: 'Куб 3' };
    //
    // const cubeFolder = gui.addFolder('Выбор куба');
    // cubeFolder.add(cubeSettings, 'currentCube', Object.keys(cubeOptions))
    //     .onChange((selectedKey) => {
    //         const modelPath = cubeOptions[selectedKey];
    //         loadModel(cube, modelPath);
    //     });
    //
    // cubeFolder.open();

    // Фоллбек для requestIdleCallback
    // function requestIdleCallbackPolyfill(cb) {
    //     setTimeout(cb, 100);
    // }

    // window.requestIdleCallback = window.requestIdleCallback || requestIdleCallbackPolyfill;

    function loadThreeModules() {
        if (threeModulesLoaded) return;
        threeModulesLoaded = true;

        loadModel(cube, "new_cube.glb");
        initialQuaternion.copy(cube.quaternion);

        function requestIdleCallbackPolyfill(cb) {
            setTimeout(cb, 100);
        }

        window.requestIdleCallback = window.requestIdleCallback || requestIdleCallbackPolyfill;
        // sliderCube.style.display = 'flex';

        // Post-processing
        const enableSSAO = false; // Отключаем для теста
        const enableFXAA = true;  // FXAA оставляем

        const composer = setupPostProcessing(renderer, scene, camera, enableSSAO, enableFXAA);
        // const composer = setupPostProcessing(renderer, scene, camera);

        // Animation loop
        function easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }

        //Image update(microphone)
        let targetRotationY = cubeGroup.rotation.y; // Целевая ротация
        let currentRotationY1 = cubeGroup.rotation.y; // Текущее значение
        let lastRotationY = cubeGroup.rotation.y;

        // function updateMicrophoneImage() {
        //     // Получаем угол в градусах
        //     let angle = -MathUtils.radToDeg(cubeGroup.rotation.y) % 75;
        //     console.log("Вызов updateMicrophoneImage, угол:", angle);
        //
        //     // Определяем индекс изображения (-4 до 4)
        //     let index = Math.round(angle / 18); // 360° / 8 граней = 45° шаг
        //     console.log(index)
        //
        //     // // Корректируем индекс для удобства
        //     // if (index > 4) index -= 8;
        //     // if (index < -4) index += 8;
        //     //
        //     // // Обновляем src в contentHTML
        //     // const newSrc = `/img/micrafon/${index}.png`;
        //     //
        //     // // Находим элемент img и меняем src
        //     // document.querySelector(".box__img img").src = newSrc;
        //     // Корректируем индекс для удобства
        //
        //     if (index > 3) index -= 8;
        //     if (index < -3) index += 8;
        //
        //     // Фиксируем картинку, если она достигла максимального или минимального значения
        //     if (index !== lastIndex) {
        //         if (index > maxRotationLimit) {
        //             index = maxRotationLimit;
        //         } else if (index < minRotationLimit) {
        //             index = minRotationLimit;
        //         }
        //
        //         lastIndex = index; // Обновляем последний индекс
        //         const newSrc = `/img/micrafon/${index}.png`;
        //
        //         // Находим элемент img и меняем src
        //         document.querySelector(".box__img img").src = newSrc;
        //     }
        // }

        let imageIndex = 0;
        const images = ["/img/micrafon/0.png", "/img/micrafon/1.png", "/img/micrafon/-1.png"];

        function updateMicrophoneImage() {
            let angle = (-MathUtils.radToDeg(cubeGroup.rotation.y)) % 360;

            // Приводим угол к диапазону -180 ... 180 для корректной работы
            if (angle > 180) angle -= 360;
            if (angle < -180) angle += 360;

            // console.log("Вызов updateMicrophoneImage, угол:", angle);

            // Если угол прошел через 0 (делаем сброс)
            if (Math.abs(angle) < 5 && Math.abs(lastRotationY) > 350) {
                // console.log("RESET: Сброс угла!");
                imageIndex = 0;
                document.querySelector(".box__img img").src = images[imageIndex];
            }

            // Проверяем смену картинки по порогу ±35°
            if (angle >= 25 && lastRotationY < 25) {
                imageIndex = 1;
                document.querySelector(".box__img img").src = images[imageIndex];
            } else if (angle <= -25 && lastRotationY > -25) {
                imageIndex = 2;
                document.querySelector(".box__img img").src = images[imageIndex];
            } else if (angle < 10 && angle > -10) {
                imageIndex = 0;
                document.querySelector(".box__img img").src = images[imageIndex];
            }

            lastRotationY = angle; // Запоминаем текущий угол
        }

        // document.addEventListener('wheel', (event) => {
        //     const scrollSpeed = 0.2; // Скорость вращения (можно подстроить)
        //     cubeGroup.rotation.y += event.deltaY * scrollSpeed * 0.01; // Инверсия направления
        //
        //     updateMicrophoneImage(); // Обновляем картинку после прокрутки
        // });

        let rotationVelocityAdd = 0.01
        const fixedFPS = 2;  // FPS в покое
        const smoothFPS = 150; // Плавный FPS при движении
        let isActive = false; // Флаг активности
        let lastInteractionTime = performance.now();
        const INACTIVITY_TIMEOUT = 2000; // Через 2 сек бездействия рендер остановится

        const animate = () => {
            if (!isActive) return; // Если анимация выключена, выходим

            const now = performance.now();
            const delta = now - lastInteractionTime;
            const targetFPS = isActive ? smoothFPS : fixedFPS;
            const frameDuration = 1000 / targetFPS;

            if (delta >= frameDuration) {
                lastInteractionTime = now;

                controls.update();

                if (isScaling) {
                    let elapsed = now - scaleStartTime;
                    const t = Math.min(elapsed / settings.scaleDuration, 1);
                    const eased = easeInOutQuad(t);
                    interactionScale = scaleFrom + (scaleToValue - scaleFrom) * eased;
                    cubeGroup.scale.setScalar(baseScale * interactionScale);
                    if (t >= 1) isScaling = false;
                }

                if (inertia) {
                    let timeElapsed = now - dragStartTime;

                    if (timeElapsed < Math.min(1000, Math.abs(10 * deltaMove.x))) {
                        rotationVelocityAdd = Math.abs(rotationVelocityAdd) >= Math.abs(rotationVelocity) ?
                            rotationVelocity : rotationVelocityAdd * 1.5;
                    } else {
                        rotationVelocityAdd *= 0.9;
                    }

                    cubeGroup.rotation.y += rotationVelocityAdd;
                    currentRotationY = cubeGroup.rotation.y;

                    updateMicrophoneImage(); // Обновляем картинку


                    if (Math.abs(rotationVelocityAdd) < 0.001) {
                        inertia = false;
                    }
                }

                if (!isAnimating && !inertia && !isScaling) {
                    cubeGroup.rotation.y = currentRotationY;
                    isActive = false;
                }

                if (isAnimating || inertia || isScaling || isDragging) {
                    updateNavPosition(true);
                    composer.render();
                    // renderer.render(scene, camera);
                    cssRenderer.render(scene, camera);
                } else {
                    composer.render();
                    // renderer.render(scene, camera);
                    cssRenderer.render(scene, camera);
                }

                renderer.shadowMap.enabled = true;
                cssRenderer.render(scene, camera);
            }

            if (isActive || performance.now() - lastInteractionTime < INACTIVITY_TIMEOUT) {
                requestAnimationFrame(animate);
                // console.log("requestAnimationFrame" + requestAnimationFrame(animate));
            } else {
                isActive = false; // Останавливаем рендер
                // console.log("Rendering stopped");
            }
        };

        // Переменные для контроля вращения
        let isSpinning = false;
        let spinVelocity = 0;
        let lastMoveTime = performance.now();
        const spinDecay = 0.96; // Коэффициент замедления

        // // Mouse down handler
        // cssRenderer.domElement.addEventListener('mousedown', (event) => {
        //     isActive = true;
        //     animate();
        //
        //     //Convert mouse coordinates to normalized device coordinates (-1 to +1)
        //     mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        //     mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        //
        //     raycaster.setFromCamera(mouse, camera);
        //
        //     const intersects = raycaster.intersectObjects([cube]);
        //     if (intersects.length > 0) {
        //         animateScale(settings.scaleSmall)
        //         isDragging = true;
        //         lastMousePosition = {x: event.clientX, y: event.clientY};
        //     }
        //
        // });

        // Wheel handler
        // cssRenderer.domElement.addEventListener('wheel', (event) => {
        //     isActive = true;
        //     animate();
        //
        //     // Предотвращаем стандартное поведение (например, прокрутку страницы)
        //     event.preventDefault();
        //
        //     inertia = false
        //     rotationVelocity = 0
        //
        //     const sensitivity = 0.01; // Чувствительность прокрутки
        //     const rotationSpeed = 0.1; // Скорость вращения
        //     const maxRotationSpeed = 0.5;
        //
        //     // Направление вращения
        //     const deltaMoveY = event.deltaY * sensitivity;
        //
        //     // Устанавливаем целевое значение для вращения
        //     targetRotationY = currentRotationY + deltaMoveY * rotationSpeed;
        //
        //     cube.rotation.y = targetRotationY
        //     currentRotationY = targetRotationY
        //
        //     // console.log('wheel is start');
        // });
        // renderer.domElement.addEventListener('wheel', (event) => {
        //     isActive = true;
        //     animate();
        //
        //     event.preventDefault(); // Предотвращаем стандартное поведение
        //
        //     inertia = false;
        //     rotationVelocity = 0;
        //
        //     const sensitivity = 0.01; // Чувствительность прокрутки
        //     const rotationSpeed = 0.1; // Скорость вращения
        //
        //     // Вычисляем изменение вращения
        //     const deltaMoveY = event.deltaY * sensitivity;
        //
        //     // Устанавливаем цель для плавного вращения
        //     targetRotationY += deltaMoveY * rotationSpeed;
        //
        //     // Запускаем плавную анимацию вращения
        //     animateRotation();
        // });

        function animateRotation() {
            isActive = true;
            animate();
            if (Math.abs(targetRotationY - currentRotationY) < 0.001) return; // Остановка при достижении цели

            // Интерполяция между текущим и целевым углом
            currentRotationY += (targetRotationY - currentRotationY) * 0.1;

            cube.rotation.y = currentRotationY;

            requestAnimationFrame(animateRotation);
        }

        // Функция запуска анимации вращения Magic360
        // function updateSpin() {
        //     if (!isSpinning) return;
        //
        //     let now = performance.now();
        //     let deltaTime = now - lastMoveTime;
        //
        //     if (deltaTime > 100) {
        //         spinVelocity *= spinDecay; // Плавное замедление
        //         if (Math.abs(spinVelocity) < 0.05) {
        //             spinVelocity = 0;
        //             isSpinning = false;
        //         }
        //         if (magicElement && typeof Magic360 !== "undefined") {
        //             Magic360.spin(magicElement, spinVelocity);
        //         }
        //     }
        //
        //     if (isSpinning) {
        //         requestAnimationFrame(updateSpin); // Зацикливаем анимацию
        //     }
        // }

        // // Mouse move handler
        // cssRenderer.domElement.addEventListener('mousemove', (event) => {
        //     isActive = true;
        //     animate();
        //
        //     mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        //     mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        //     raycaster.setFromCamera(mouse, camera);
        //
        //     const intersects = raycaster.intersectObjects([cube]);
        //
        //     if (intersects.length === 0) {
        //         isActive = true
        //         renderer.domElement.style.cursor = 'default';
        //         cssRenderer.domElement.style.cursor = 'default';
        //
        //     } else {
        //         isActive = true
        //         renderer.domElement.style.cursor = 'pointer';
        //         cssRenderer.domElement.style.cursor = 'pointer';
        //     }
        //     if (!isDragging) return
        //
        //     deltaMove.x = Math.min(event.clientX - lastMousePosition.x, 30)
        //     lastMousePosition = {x: event.clientX, y: event.clientY};
        //
        //     const sensitivity = settings.sensitivity;
        //     const rotationSpeed = settings.rotationSpeed;
        //     targetRotationY = settings.durationRotate * 1.8 * rotationSpeed * sensitivity * Math.sign(deltaMove.x);
        //
        //     if (!inertia || Math.sign(rotationVelocityAdd) !== Math.sign(deltaMove.x)) {
        //         rotationVelocityAdd = 0.01 * Math.sign(deltaMove.x)
        //     }
        //
        //     rotationVelocity = targetRotationY;
        //
        //     dragStartTime = performance.now();
        //     inertia = true;
        // });

        // Mouse up and leave handlers
        // const stopDragging = (event) => {
        //     animateScale(1);
        //     isDragging = false;
        //
        //     if (spinVelocity !== 0) {
        //         isSpinning = true;
        //         updateSpin(); // Запускаем плавное замедление
        //     }
        // };
        // cssRenderer.domElement.addEventListener('mouseup', stopDragging);
        // cssRenderer.domElement.addEventListener('mouseleave', stopDragging);

        // for mobile version
        // if (window.innerWidth < 768) {
        //     // Обработчик касания (аналоzг mousedown)
        //     cssRenderer.domElement.addEventListener('touchstart', (event) => {
        //         isActive = true;
        //         animate();
        //
        //         const touch = event.touches[0];
        //         mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        //         mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        //
        //         raycaster.setFromCamera(mouse, camera);
        //         const intersects = raycaster.intersectObjects([cube]);
        //
        //         if (intersects.length > 0) {
        //             animateScale(settings.scaleSmall);
        //             isDragging = true;
        //             lastMousePosition = {x: touch.clientX, y: touch.clientY};
        //         }
        //     });
        //
        //     // Обработчик перемещения пальцем (аналог mousemove)
        //     cssRenderer.domElement.addEventListener('touchmove', (event) => {
        //         if (!isDragging) return;
        //
        //         isActive = true;
        //         animate();
        //
        //         const touch = event.touches[0];
        //         deltaMove.x = Math.min(touch.clientX - lastMousePosition.x, 30);
        //
        //         lastMousePosition = {x: touch.clientX, y: touch.clientY};
        //
        //         const sensitivity = settings.sensitivity;
        //         const rotationSpeed = settings.rotationSpeed;
        //
        //         targetRotationY = settings.durationRotate * 1.8 * rotationSpeed * sensitivity * Math.sign(deltaMove.x);
        //
        //         if (!inertia || Math.sign(rotationVelocityAdd) !== Math.sign(deltaMove.x)) {
        //             rotationVelocityAdd = 0.01 * Math.sign(deltaMove.x);
        //         }
        //
        //         rotationVelocity = targetRotationY;
        //         dragStartTime = performance.now();
        //         inertia = true;
        //
        //         // Привязываем Magic360 к движению куба
        //         if (magicElement && typeof Magic360 !== "undefined") {
        //             let spinSpeed = 0.5;
        //             spinVelocity = deltaMove.x * spinSpeed;
        //             lastMoveTime = performance.now();
        //             Magic360.spin(magicElement, spinVelocity);
        //         }
        //
        //         event.preventDefault(); // Предотвращает скролл страницы при свайпе
        //     }, {passive: false});
        //
        //     // Обработчик окончания касания (аналог mouseup)
        //     cssRenderer.domElement.addEventListener('touchend', () => {
        //         animateScale(1);
        //         isDragging = false;
        //
        //         if (spinVelocity !== 0) {
        //             isSpinning = true;
        //             updateSpin(); // Запускаем плавное замедление
        //         }
        //     });
        // }

        const handleInteractionStart = (event) => {
            isActive = true;
            animate();

            let clientX, clientY;
            if (event.type.startsWith('touch')) {
                const touch = event.touches[0];
                clientX = touch.clientX;
                clientY = touch.clientY;
            } else {
                clientX = event.clientX;
                clientY = event.clientY;
            }

            mouse.x = (clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects([cube]);

            if (intersects.length > 0) {
                animateScale(settings.scaleSmall);
                isDragging = true;
                lastMousePosition = {x: clientX, y: clientY};
            }
        };
        const handleInteractionMove = (event) => {
            if (!isDragging) return;

            isActive = true;
            animate();

            let clientX, clientY;
            if (event.type.startsWith('touch')) {
                const touch = event.touches[0];
                clientX = touch.clientX;
                clientY = touch.clientY;
            } else {
                clientX = event.clientX;
                clientY = event.clientY;
            }

            deltaMove.x = Math.min(clientX - lastMousePosition.x, 30);
            lastMousePosition = {x: clientX, y: clientY};

            const sensitivity = settings.sensitivity;
            const rotationSpeed = settings.rotationSpeed;
            targetRotationY = settings.durationRotate * 1.8 * rotationSpeed * sensitivity * Math.sign(deltaMove.x);

            if (!inertia || Math.sign(rotationVelocityAdd) !== Math.sign(deltaMove.x)) {
                rotationVelocityAdd = 0.01 * Math.sign(deltaMove.x);
            }

            rotationVelocity = targetRotationY;
            dragStartTime = performance.now();
            inertia = true;

            event.preventDefault(); // Предотвращает скролл страницы при свайпе

        };
        const handleInteractionEnd = () => {
            animateScale(1);
            isDragging = false;

            if (spinVelocity !== 0) {
                isSpinning = true;
                updateSpin(); // Запускаем плавное замедление
            }
        };

        function animateScale(toMultiplier) {
            scaleFrom = interactionScale;
            scaleToValue = toMultiplier;
            scaleStartTime = performance.now();
            isScaling = true;
        }

        // Назначаем обработчики событий
        const events = ['mousedown', 'touchstart'];
        events.forEach(event => cssRenderer.domElement.addEventListener(event, handleInteractionStart));
        const moveEvents = ['mousemove', 'touchmove'];
        moveEvents.forEach(event => cssRenderer.domElement.addEventListener(event, handleInteractionMove, {passive: false}));
        const endEvents = ['mouseup', 'mouseleave', 'touchend'];
        endEvents.forEach(event => cssRenderer.domElement.addEventListener(event, handleInteractionEnd));

        const rotations = [
            0,                // 1-я грань (0°)
            Math.PI / 2,      // 2-я грань (90°)
            Math.PI,          // 3-я грань (180°)
            (3 * Math.PI) / 2 // 4-я грань (270°)
        ];
        navs.forEach(nav => {
            nav.addEventListener('mousedown', (e) => {
                isActive = true;
                animate();

                isDraggingSlide = true;
                startX = e.clientX - currentX;
                nav.classList.add('dragging');
            });
        });

        // Добавляем клик по квадратикам (дополнительно к mousemove)
        // items.forEach(item => {
        //     item.addEventListener('click', (e) => {
        //         e.preventDefault(); // Предотвращаем переход по ссылке
        //
        //         const itemLeft = item.offsetLeft; // Берем позицию квадратика
        //         // const offset = 61.8; // Смещаем на 20px левее
        //         const offset = 11.8;
        //         animateToPosition(itemLeft - offset); // Запускаем анимацию с учетом смещения
        //     });
        // });

        // function animateToPosition(targetX) {
        //     // let startTime;
        //     // const startX = currentX;
        //     // const duration = 500; // Длительность анимации в мс
        //     //
        //     // function step(timestamp) {
        //     //     if (!startTime) startTime = timestamp;
        //     //     const progress = Math.min((timestamp - startTime) / duration, 1);
        //     //     currentX = startX + (targetX - startX) * easeOutQuad(progress);
        //     //
        //     //     updateNavPosition(); // Обновляем положение навигации
        //     //
        //     //     if (progress < 1) {
        //     //         requestAnimationFrame(step);
        //     //     }
        //     // }
        //     //
        //     // requestAnimationFrame(step);
        //
        //     let startTime;
        //     const startX = currentX;
        //     const duration = 500; // Длительность анимации в мс
        //     let targetRotationIndex = Math.round(targetX / (sliderCube.offsetWidth / rotations.length));
        //     let targetRotation = rotations[targetRotationIndex];
        //
        //     function step(timestamp) {
        //         if (!startTime) startTime = timestamp;
        //         const progress = Math.min((timestamp - startTime) / duration, 1);
        //         // cubeGroup.rotation.y = currentRotationY + (targetRotation - currentRotationY) * easeOutQuad(progress);
        //         currentX = currentRotationY + (targetRotation - currentRotationY) * easeOutQuad(progress);
        //
        //         updateNavPosition();
        //
        //         if (progress < 1) {
        //             requestAnimationFrame(step);
        //         } else {
        //             currentRotationY = targetRotation; // Установим точное значение после анимации
        //         }
        //     }
        //
        //     requestAnimationFrame(step);
        // }
        function animateToPosition(targetX) {
            let startTime;
            const startX = currentX;
            const startRotation = currentRotationY;
            const duration = 500; // Длительность анимации в мс

            let targetRotationIndex = Math.round(targetX / (sliderCube.offsetWidth / rotations.length));
            let targetRotation = rotations[targetRotationIndex];

            function step(timestamp) {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);

                // Плавный поворот куба
                cubeGroup.rotation.y = startRotation + (targetRotation - startRotation) * easeOutQuad(progress);

                // Обновление позиции палочек
                currentX = (cubeGroup.rotation.y / (Math.PI * 2)) * navWidth * 3.95;
                // console.log(currentX);
                updateNavPosition();

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    currentRotationY = targetRotation; // Устанавливаем точное значение
                }
            }

            requestAnimationFrame(step);
        }

        function easeOutQuad(t) {
            return t * (2 - t);
        }

        document.addEventListener('mouseleave', () => {
            isDraggingSlide = false;
            navs.forEach(nav => nav.classList.remove('dragging'));
        });
        getRotationPercentage(cube);

        document.addEventListener('mousemove', (e) => {
            isActive = true;
            animate();

            if (!isDraggingSlide) return;

            if (inertia) {
                inertia = false;
                rotationVelocity = 0;
            }
            currentX = e.clientX - startX;
            console.log(currentX);

            updateNavPosition();
            updateMicrophoneImage(); // Обновляем картинку
        });
        document.addEventListener('mouseup', () => {
            isDraggingSlide = false;
            navs.forEach(nav => nav.classList.remove('dragging'));
        });

        updateNavPosition(true);
        // Запускаем анимацию
        animate();
    }

    document.addEventListener("mousemove", loadThreeModules, {once: true});
    document.addEventListener("touchstart", loadThreeModules, {once: true});

    let isRendered = false; // Флаг, чтобы убедиться, что рендеринг происходит только один раз

    // function updateNavPosition(disable = false) {
    //     if (!disable) {
    //         const percent = currentX / ((sliderCube.offsetWidth - 12) / 100);
    //         currentRotationY = (percent / 100) * (Math.PI * 2);
    //     } else {
    //         currentX = getRotationPercentage(cube) * ((sliderCube.offsetWidth - 12) / 100);
    //     }
    //
    //     [firstNav, secondNav].forEach((nav, index) => {
    //         nav.style.left = `${currentX + index * (navWidth + gap)}px`;
    //     });
    //
    //     // updateItemOpacity();
    // }

    function updateNavPosition(disable = false) {
        const sliderWidth = sliderCube.offsetWidth;
        const maxPosition = sliderWidth - 95; // Максимальная граница движения

        console.log(maxPosition);

        if (!disable) {
            const percent = currentX / (maxPosition / 100);
            currentRotationY = (percent / 100) * (-Math.PI * 2);
        } else {
            currentX = getRotationPercentage(cube) * (maxPosition / 100);
        }

        // Исправляем баг: если полоски ушли за границу, переносим их обратно
        if (currentX < -100) {
            currentX = maxPosition - 50;
        } else if (currentX > maxPosition) {
            currentX = -40;
        }

        [firstNav, secondNav].forEach((nav, index) => {
            nav.style.left = `${currentX + index * (navWidth + gap)}px`;
        });

        // updateItemOpacity();
    }

    updateNavPosition(true);

    // function updateItemOpacity() {
    //     items.forEach(item => {
    //         const itemLeft = item.offsetLeft;
    //         let opacity = 0.6;
    //
    //         const firstNavLeft = firstNav.offsetLeft;
    //         const secondNavLeft = secondNav.offsetLeft;
    //
    //         const firstNavRight = firstNavLeft + navWidth;
    //         const secondNavRight = secondNavLeft + navWidth;
    //
    //
    //         if ((itemLeft > firstNavLeft && itemLeft < firstNavRight) || (itemLeft > secondNavLeft && itemLeft < secondNavRight)) {
    //             opacity = 1;
    //         }
    //
    //         item.style.opacity = opacity;
    //     });
    // }

    const renderOnce = () => {
        if (isRendered) return; // Если уже отрендерили, выходим
        renderer.render(scene, camera); // Отрендерим сцену
        cssRenderer.render(scene, camera);
        isRendered = true; // Устанавливаем флаг, чтобы рендеринг больше не выполнялся
    };
    setTimeout(() => {
        renderOnce();
    }, 220);

    cubeGroup.add(cube);  // Темно-серый куб
    cubeGroup.add(facesGroup); // HTML-грани

    scene.add(cubeGroup);
    cubeGroup.scale.setScalar(baseScale * interactionScale);

    // Создаем FPS-счетчик
    setupDebug(camera, cube);

    setTimeout(() => {
        // Export cards script
        const wrapper = document.querySelectorAll(".cardWrap");
        wrapper.forEach(element => {
            let state = {
                mouseX: 0,
                mouseY: 0,
                height: element.clientHeight,
                width: element.clientWidth
            };

            element.addEventListener("mousemove", (ele) => {
                requestAnimationFrame(() => {
                    const card = element.querySelector(".card");
                    const cardBg = card.querySelector(".cardBg");

                    state.mouseX = ele.clientX - element.getBoundingClientRect().left - state.width / 2;
                    state.mouseY = ele.clientY - element.getBoundingClientRect().top - state.height / 2;

                    const angleX = (state.mouseX / state.width) * 50;
                    const angleY = (state.mouseY / state.height) * -50;
                    card.style.transform = `rotateY(${angleX}deg) rotateX(${angleY}deg)`;

                    const posX = (state.mouseX / state.width) * -60;
                    const posY = (state.mouseY / state.height) * -60;
                    cardBg.style.transform = `translateX(${posX}px) translateY(${posY}px)`;
                });
            });

            element.addEventListener("mouseout", () => {
                setTimeout(() => {
                    requestAnimationFrame(() => {
                        const card = element.querySelector(".card");
                        const cardBg = card.querySelector(".cardBg");
                        const cardText = card.querySelector(".card__title");

                        card.style.transform = `rotateY(0deg) rotateX(0deg) `;
                        cardBg.style.transform = `translateX(0px) translateY(0px)`;
                        cardText.style.transform = `translateX(0px) translateY(0px)`;
                    });
                }, 1000);
            });
        });

        // Effect text security & atom
        $(document).ready(function () {
            const $securityText = $(".security-box__text");
            const $cardsContainer = $(".security-box .cards");
            let lastHoveredCard = null; // Отслеживание последней наведённой карточки

            if ($securityText.length === 0 || $cardsContainer.length === 0) {
                console.error("Не найден .security-box или .security-box__text");
                return;
            }

            function bounceElement(
                $element,
                startPosition = "0px",
                endPosition = "50px",
                duration = 500) {
                $element
                    .stop(true, true)
                    .css({top: startPosition, opacity: 0})
                    .animate(
                        {top: endPosition, opacity: 1},
                        {
                            duration: duration,
                            easing: "easeOutBounce",
                        }
                    );
            }

            $cardsContainer.on("mouseenter", ".tilt", function () {
                // Если мышка снова попала на ту же карту, не запускаем анимацию
                if (lastHoveredCard === this) return;
                lastHoveredCard = this; // Запоминаем последнюю карту

                const text = $(this).data("text");
                if (text) {
                    $securityText.text(text);
                    bounceElement($securityText);
                }
            });
            $cardsContainer.on("mouseleave", ".tilt", function () {
                lastHoveredCard = null; // Сбрасываем последнюю карту, когда мышка уходит
                $securityText.stop(true, true).fadeOut(200, function () {
                    $(this).css({top: "0", opacity: 0}).show();
                });
            });


            const $langBlock = $(".support-lan-box .loading");
            const $langSection = $(".support-lan-box section");
            const $langSlider = $(".support-lan-box .center");

            function bounceElementSlider($el, up = true) {
                if (up) {
                    // Поднимаем вверх и увеличиваем
                    $el.stop(true, true).animate(
                        {top: "-85px", left: '45%', width: "300px"},
                        {duration: 1000, easing: "easeOutBounce",}
                    );
                    // $langBlock.css("height", "292px");

                } else {
                    // Возвращаем обратно
                    $el.stop(true, true).animate(
                        {top: "24px", left: '53%', width: "110px"},
                        {duration: 1000, easing: "easeOutBounce",}
                    );
                    // $langBlock.css("height", "340px");

                }
            }

            $langSection.hover(
                function () {
                    bounceElementSlider($langSlider, true); // Навели мышь → подпрыгнул
                },
                function () {
                    bounceElementSlider($langSlider, false); // Убрали мышь → вернулся
                }
            );

        });

        const tiltElements = document.querySelectorAll(".tilt");
        let timeoutId = null;
        VanillaTilt.init(tiltElements, {
            max: 25,        // Максимальный угол наклона
            speed: 1000,     // Скорость возвращения
            glare: true,    // Блик
            "max-glare": .1,  // Интенсивность блика
            perspective: 2000, // Глубина 3D
            scale: 1.05,
            reset: false,
            reverse: true,
            axis: "y",
        });
        tiltElements.forEach((element) => {
            element.addEventListener("mouseenter", () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    console.log("❌ Таймер сброшен");
                    timeoutId = null;
                }
                element.classList.add("tilt-hover"); // Добавляем эффект сразу при наведении
            });
            element.addEventListener("mousemove", () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    console.log("❌ Таймер сброшен");
                    timeoutId = null;
                }
                element.classList.add("tilt-hover"); // Добавляем эффект сразу при наведении
            });

            element.addEventListener("mouseleave", () => {
                setTimeout(() => {
                    // Уничтожаем текущий эффект
                    element.vanillaTilt.destroy();

                    // Создаем новый с reverse: true
                    VanillaTilt.init(element, {
                        max: 25,
                        speed: 1000,
                        glare: true,
                        "max-glare": 0.1,
                        perspective: 2000,
                        scale: 1.05,
                        reset: false,
                        reverse: true, // Изменяем параметр
                        axis: "y",
                    });

                    element.classList.remove("tilt-hover");
                    timeoutId = null;
                }, 1000);
            });
        });
    }, 250);
})



