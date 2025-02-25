import {Raycaster, Vector2, Fog, Object3D} from 'three/src/Three.js';
import {scene, camera, renderer, controls} from './scene.js';
import {getRotationPercentage, loadEnvironment} from './functions.js';
import {loadModel} from "./modelLoader.js";
import {setupDebug} from "./debug.js";
import {setupPostProcessing} from "./postProcessing.js";
import {settings} from "./config.js";
import {CSS3DRenderer, CSS3DObject} from "three/addons/renderers/CSS3DRenderer.js";

window.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(renderer.domElement);

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

    // const cube = new THREE.Mesh(geometry, material);
    const cube = new Object3D();
    cube.rotation.set(0, 0, 0);
    cube.position.y = -0.00;
    // cube.position.y = 0.53;

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

    loadModel(cube, "cube_bevel_0.04_meshopt.glb");

    // Фоллбек для requestIdleCallback
    function requestIdleCallbackPolyfill(cb) {
        setTimeout(cb, 100);
    }

    window.requestIdleCallback = window.requestIdleCallback || requestIdleCallbackPolyfill;

    function loadThreeModules() {
        if (threeModulesLoaded) return;
        threeModulesLoaded = true;

        // // HTML-рендерер
        // const cssRenderer = new CSS3DRenderer();
        // cssRenderer.setSize(window.innerWidth, window.innerHeight);
        // document.body.appendChild(cssRenderer.domElement);
        //
        // // Создаем HTML-элементы для граней куба
        // function createFace(contentId) {
        //     const div = document.createElement("div");
        //     div.innerHTML = contentHTML[contentId];
        //     div.style.transform = "rotateY(180deg)"; // Переворачиваем текст
        //     div.style.display = "flex";
        //     div.style.justifyContent = "center";
        //     div.style.alignItems = "center";
        //
        //     const object = new CSS3DObject(div);
        //     return object;
        // }
        //
        //
        // const faces = [];
        //
        // // Позиции граней
        // const positions = [
        //     {x: 0, y: 0, z: 100, rx: 0, ry: 0, contentId: "front-content"}, // Передняя
        //     {x: 0, y: 0, z: -100, rx: 0, ry: Math.PI, contentId: "back-content"}, // Задняя
        //     {x: -100, y: 0, z: 0, rx: 0, ry: -Math.PI / 2, contentId: "left-content"}, // Левая
        //     {x: 100, y: 0, z: 0, rx: 0, ry: Math.PI / 2, contentId: "right-content"}, // Правая
        // ];
        //
        // const contentHTML = {
        //     "front-content": `
        //     <div style="width: 100%;  height: 100%; background: center center no-repeat; background-size: cover;">
        //         <h2>Первая сторона</h2>
        //         <img style="width: 120px; height: 120px;" src="/img/microphone.webp" alt="microphone">
        //     </div>`,
        //     "back-content": `
        //     <div style="width: 200px;  height: 200px; color: #ffffff; background: url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoFRQjM-wM_nXMA03AGDXgJK3VeX7vtD3ctA&s') center center no-repeat; background-size: cover;">
        //         <h2>Вторая сторона</h2>
        //     </div>`,
        //     "left-content": `
        //     <div style="width: 200px;  height: 200px; color: #ffffff; background: url('https://static.vecteezy.com/ti/photos-gratuite/p1/29360891-une-petit-vert-lezard-seance-sur-haut-de-une-arbre-bifurquer-generatif-ai-gratuit-photo.jpg') center center no-repeat; background-size: cover;">
        //         <h2>Третья сторона</h2>
        //     </div>`,
        //     "right-content": `
        //     <div style="width: 200px;  height: 200px; color: #ffffff; background: url('https://static.vecteezy.com/ti/photos-gratuite/t1/2253951-gros-plan-d-un-cameleon-sur-une-branche-photo.jpg') center center no-repeat; background-size: cover;">
        //         <h2>Четвертая сторона</h2>
        //     </div>`
        // };
        //
        // positions.forEach(({ x, y, z, rx, ry, contentId }) => {
        //     const face = createFace(contentId);
        //     face.position.set(x, y, z);
        //     face.rotation.set(rx, ry, 0);
        //     // cube.add(face); // Добавляем HTML-объект к загруженному кубу
        // });


        // Post-processing
        const enableSSAO = false; // Отключаем для теста
        const enableFXAA = true;  // FXAA оставляем

        const composer = setupPostProcessing(renderer, scene, camera, enableSSAO, enableFXAA);
        // const composer = setupPostProcessing(renderer, scene, camera);

        // Animation loop
        function easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }

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
                    cube.scale.setScalar(baseScale * interactionScale);
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

                    cube.rotation.y += rotationVelocityAdd;
                    currentRotationY = cube.rotation.y;

                    if (Math.abs(rotationVelocityAdd) < 0.001) {
                        inertia = false;
                    }
                }

                if (!isAnimating && !inertia && !isScaling) {
                    cube.rotation.y = currentRotationY;
                    isActive = false;
                }

                if (isAnimating || inertia || isScaling || isDragging) {
                    updateNavPosition(true);
                    composer.render();
                } else {
                    renderer.render(scene, camera);
                }

                renderer.shadowMap.enabled = false;
            }

            if (isActive || performance.now() - lastInteractionTime < INACTIVITY_TIMEOUT) {
                requestAnimationFrame(animate);
                // console.log("requestAnimationFrame" + requestAnimationFrame(animate));
            } else {
                isActive = false; // Останавливаем рендер
                // console.log("Rendering stopped");
            }
        };


        // Mouse down handler
        renderer.domElement.addEventListener('mousedown', (event) => {
            isActive = true;
            animate();

            //Convert mouse coordinates to normalized device coordinates (-1 to +1)
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

        // Wheel handler
        renderer.domElement.addEventListener('wheel', (event) => {
            isActive = true;
            animate();

            // Предотвращаем стандартное поведение (например, прокрутку страницы)
            event.preventDefault();

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

            // console.log('wheel is start');
        });

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

        // Mouse move handler
        renderer.domElement.addEventListener('mousemove', (event) => {
            isActive = true;
            animate();

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

            const sensitivity = settings.sensitivity;
            const rotationSpeed = settings.rotationSpeed;

            targetRotationY = settings.durationRotate * 1.8 * rotationSpeed * sensitivity * Math.sign(deltaMove.x);

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

        renderer.domElement.addEventListener('mouseup', stopDragging);
        renderer.domElement.addEventListener('mouseleave', stopDragging);

        // Запускаем анимацию
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
        getRotationPercentage(cube);

        navs.forEach(nav => {
            nav.addEventListener('mousedown', (e) => {
                isDraggingSlide = true;
                startX = e.clientX - currentX;
                nav.classList.add('dragging');
            });
        });

        document.addEventListener('mousemove', (e) => {
            isActive = true;
            animate();

            if (!isDraggingSlide) return;

            if (inertia) {
                inertia = false;
                rotationVelocity = 0;
            }
            currentX = e.clientX - startX;
            // console.log(currentX);

            updateNavPosition();
        });

        // Добавляем клик по квадратикам (дополнительно к mousemove)
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault(); // Предотвращаем переход по ссылке

                const itemLeft = item.offsetLeft; // Берем позицию квадратика
                const offset = 61.8; // Смещаем на 20px левее
                animateToPosition(itemLeft - offset); // Запускаем анимацию с учетом смещения
            });
        });

        function animateToPosition(targetX) {
            let startTime;
            const startX = currentX;
            const duration = 500; // Длительность анимации в мс

            function step(timestamp) {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                currentX = startX + (targetX - startX) * easeOutQuad(progress);

                updateNavPosition(); // Обновляем положение навигации

                if (progress < 1) {
                    requestAnimationFrame(step);
                }
            }

            requestAnimationFrame(step);
        }

        function easeOutQuad(t) {
            return t * (2 - t);
        }

        document.addEventListener('mouseup', () => {
            isDraggingSlide = false;
            navs.forEach(nav => nav.classList.remove('dragging'));
        });

        updateNavPosition(true);
    }

    document.addEventListener("mousemove", loadThreeModules, {once: true});
    document.addEventListener("touchstart", loadThreeModules, {once: true});

    // let isActiveFirst = false; // Флаг активности
    // const firstAnimate = () => {
    //     if (!isActiveFirst) return; // Если анимация выключена, выходим
    //
    //     if (isActiveFirst) {
    //         renderer.render(scene, camera);
    //         console.log("Rendering");
    //     } else {
    //         console.log("Rendering stopped");
    //         isActiveFirst = false; // Останавливаем рендер
    //     }
    // };
    //
    // // **Задержка на активацию анимации через 5 секунд**
    // setTimeout(() => {
    //     isActiveFirst = true;  // Включаем анимацию через 5 секунд
    //     firstAnimate();
    // }, 600); // 5000 миллисекунд (5 секунд)
    //
    // // **Задержка на остановку анимации через 8 секунд (через 3 секунды после начала)**
    // setTimeout(() => {
    //     isActiveFirst = false;  // Останавливаем анимацию через 3 секунды после начала
    // }, 600); // 8000 миллисекунд (8 секунд)

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
        const maxPosition = sliderWidth - 10; // Максимальная граница движения

        if (!disable) {
            const percent = currentX / (maxPosition / 100);
            currentRotationY = (percent / 100) * (Math.PI * 2);
        } else {
            currentX = getRotationPercentage(cube) * (maxPosition / 100);
        }

        // 🛠 Исправляем баг: если полоски ушли за границу, переносим их обратно
        if (currentX < 0) {
            currentX = maxPosition;
        } else if (currentX > maxPosition) {
            currentX = 0;
        }

        [firstNav, secondNav].forEach((nav, index) => {
            nav.style.left = `${currentX + index * (navWidth + gap)}px`;
        });

        // updateItemOpacity();
    }


    updateNavPosition(true);

    function updateItemOpacity() {
        items.forEach(item => {
            const itemLeft = item.offsetLeft;
            let opacity = 0.6;

            const firstNavLeft = firstNav.offsetLeft;
            const secondNavLeft = secondNav.offsetLeft;

            const firstNavRight = firstNavLeft + navWidth;
            const secondNavRight = secondNavLeft + navWidth;


            if ((itemLeft > firstNavLeft && itemLeft < firstNavRight) || (itemLeft > secondNavLeft && itemLeft < secondNavRight)) {
                opacity = 1;
            }

            item.style.opacity = opacity;
        });
    }

    const renderOnce = () => {
        if (isRendered) return; // Если уже отрендерили, выходим
        renderer.render(scene, camera); // Отрендерим сцену
        isRendered = true; // Устанавливаем флаг, чтобы рендеринг больше не выполнялся
    };
    // Вызовем рендеринг сразу, например, через небольшую задержку
    setTimeout(() => {
        renderOnce();
    }, 220); // 600 миллисекунд, можно сразу после загрузки страницы

    // setupCubeControls(renderer, cube, cubeState);
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
    cube.scale.setScalar(baseScale * interactionScale);

    // Создаем FPS-счетчик
    setupDebug(camera, cube);
})

