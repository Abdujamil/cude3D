import {Raycaster, Vector2, Fog, Object3D, Group} from 'three/src/Three.js';
import {scene, camera, renderer, controls, cssRenderer} from './scene.js';
import {getRotationPercentage, loadEnvironment} from './functions.js';
import {loadModel} from "./modelLoader.js";
import {setupDebug} from "./debug.js";
import {setupPostProcessing} from "./postProcessing.js";
import {settings} from "./config.js";
import {CSS3DObject} from "three/addons/renderers/CSS3DRenderer.js";
import {GUI} from "lil-gui";

window.addEventListener('DOMContentLoaded', () => {
    // document.body.appendChild(cssRenderer.domElement);
    // document.body.appendChild(renderer.domElement);

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


    // Позиции граней
    const positions = [
        {x: 0, y: -4, z: 487, rx: 0, ry: 0, contentId: "front-content"}, // microphone
        {x: 1, y: -4, z: -485, rx: 0, ry: Math.PI, contentId: "back-content"}, //  Export
        {x: -515, y: -4, z: -1, rx: 0, ry: -Math.PI / 2, contentId: "left-content"}, // react
        {x: 515, y: -4, z: 0, rx: 0, ry: Math.PI / 2, contentId: "right-content"}, // security
    ];

    // Создаем HTML-элементы для граней куба
    let currentFace = null;
    let faces = [];

    function createFace(contentId) {
        const div = document.createElement("div");
        div.style.backdropFilter = `blur(${settings.backgroundBlur}px)`;
        div.style.background = 'rgba(5,5,5,0.4)';
        // div.style.background = 'rgba(255,255,255,0.4)';
        // div.style.width = "960px";
        div.style.border = '1px solid black';
        div.style.height = "520px";
        div.style.padding = "40px";
        div.innerHTML = contentHTML[contentId];
        div.style.overflow = "hidden";
        let object = new CSS3DObject(div);
        faces.push(object);
        currentFace = object;
        return currentFace;
    }

    function updateBlur() {
        faces.forEach(face => {
            face.element.style.backdropFilter = `blur(${settings.backgroundBlur}px)`;
        });
    }

    const gui = new GUI();
    gui.add(settings, 'backgroundBlur', 0, 100, 1).onChange(updateBlur);

    const facesFolder = gui.addFolder("Faces Positions");

    positions.forEach((pos, index) => {
        const faceFolder = facesFolder.addFolder(`Face ${index + 1} (${pos.contentId})`);
        faceFolder.add(pos, "x", -1000, 1000, 1).name("Position X").onChange(() => updateFacePosition(index));
        faceFolder.add(pos, "z", -1000, 1000, 1).name("Position Z").onChange(() => updateFacePosition(index));
    });

    function updateFacePosition(index) {
        const face = faces[index];
        if (face) {
            face.position.set(positions[index].x, positions[index].y, positions[index].z);
        }
    }

    const contentHTML = {
        "front-content": `
            <div class="box micro-box">
            <div class="box__img">
                <img src="/img/microphone.webp" alt="microphone">
            </div>
            <div class="box__content">
                <ul class="text-list">
                    <li>
                        <img src="/img/done.png" alt="done icon">
                        <p>Бесплатные 30 минут при регистрации.</p>
                    </li>
                    <li>
                        <img src="/img/done.png" alt="done icon">
                        <p>Стоимость минуты от 1 рубля.</p>
                    </li>
                    <li>
                        <img src="/img/done.png" alt="done icon">
                        <p>Покупайте минуты себе и делитесь ими.</p>
                    </li>
                    <li>
                        <img src="/img/done.png" alt="done icon">
                        <p>Покупка минут в подарок.</p>
                    </li>
                    <li>
                        <img src="/img/done.png" alt="done icon">
                        <p>Пополнение баланса другого аккаунта.</p>
                    </li>
                    <li>
                        <img src="/img/done.png" alt="done icon">
                        <p>Пополнение балансом мобильного телефона.</p>
                    </li>
                    <li>
                        <img src="/img/done.png" alt="done icon">
                        <p>Пополнение банковской картой, QR-кодом, СБП.</p>
                    </li>
                    <li>
                        <img src="/img/done.png" alt="done icon">
                        <p>Платите только за использованные секунды. </p>
                    </li>
                    <li>
                        <img src="/img/done.png" alt="done icon">
                        <p>Постоплата, рассрочка платежа  юр. лицам.</p>
                    </li>
                </ul>
            </div>
        </div>
            `,
        "back-content": `
            <div class="box export-box">
            <div class="box__title">
                <h2>Экспорт файла</h2>
            </div>
            <div class="box__content">
                <div class="cards">
                    <div class="card">
                        <div class="card__title">
                            <h3>DOCX</h3>
                            <p>MS Word</p>
                        </div>
                        <div class="card__image">
                            <img src="/img/word-icon.png" alt="word-icon">
                        </div>
                    </div>
                    <div class="card">
                        <div class="card__title">
                            <h3>XLSX</h3>
                            <p>MS Excel </p>
                        </div>
                        <div class="card__image">
                            <img src="/img/excel-icon.png" alt="word-icon">
                        </div>
                    </div>
                    <div class="card">
                        <div class="card__title">
                            <h3>PDF</h3>
                            <p style="opacity: 0">Pdf</p>
                        </div>
                        <div class="card__image">
                            <img src="/img/pdf-icon.png" alt="pdf-icon">
                        </div>
                    </div>
                    <div class="card">
                        <div class="card__title">
                            <h3>TXT</h3>
                            <p>Блокнот</p>
                        </div>
                        <div class="card__image">
                            <img src="/img/txt-icon.png" alt="word-icon">
                        </div>
                    </div>
                    <div class="card">
                        <div class="card__title">
                            <h3>SRT</h3>
                            <p>Субтитры</p>
                        </div>
                        <div class="card__image">
                            <img src="/img/youtube-icon.png" alt="word-icon">
                        </div>
                    </div>
                </div>
            </div>
            <div class="box_foot">
                <p>
                    Вы можете экспортировать файлы в нужный для Вас формат и делиться готовым результатом.
                </p>
            </div>
        </div>
          `,
        "left-content": `
           <div class="box support-lan-box">
            <div class="box__img">
                <img src="/img/react.png" alt="react">
            </div>
            <div class="box__text">
                <div class="title">
                    <h2>Поддерживаемые языки</h2>
                </div>
                <div class="text">
                    <p>
                        Наш сервис обладает способностью распознавать и транскрибировать речь более чем на 100 языках:
                        English, Español, Français, German, Italiana, 日本語, Nederlands, Português. Мы предоставляем
                        высококачественные услуги, обеспечивая точность и эффективность процесса.
                        <br>
                        <br>
                        С нами ваша информация будет представлена в удобном и понятном виде, гарантируя легкость
                        восприятия и использования.
                    </p>
                </div>
                <a href="#" class="text-link">Все поддерживаемые языки</a>
            </div>
        </div>
           `,
        "right-content": `
             <div class="box security-box">
            <div class="box__title">
                <h2>Данные надежно защищены: храним, шифруем, никому не передаем</h2>
            </div>
            <div class="box__content">
                <div class="cards">
                    <div class="card" data-text="Данные автоматически сохраняются на наших серверах посредством облачных резервных копий с усовершенствованным шифрованием и надежными протоколами хранения.">
                        <div class="card__title">
                            <p class="animate-text" id="animate-text1">Резервное копирование</p>
                        </div>
                        <div class="card__image">
                            <img class="search-icon" src="/img/search.png" alt="search-icon">
                        </div>
                    </div>
                    <div class="card" data-text="Все аккаунты имеют требования аутентификации, чтобы защитить в вашем личном кабинете. Мы не передаем ваши данные третьим лицам.">
                        <div class="card__title">
                            <p class="animate-text" id="animate-text2">Доступ и хранение</p>
                        </div>
                        <div class="card__image">
                            <img class="person-icon" src="/img/person.png" alt="person-icon">
                        </div>
                    </div>
                    <div class="card" data-text="Передаваемые данные шифруются с использованием TLS 1.2+, а при хранении — с использованием стандартного алгоритма AES-256.">
                        <div class="card__title">
                            <p class="animate-text" id="animate-text3">Безопасность</p>
                        </div>
                        <div class="card__image">
                            <img class="lock-icon" src="/img/lock.png" alt="lock-icon">
                        </div>
                    </div>
                    <div class="card" data-text="Защита данных пользователей — высший приоритет для нас, поэтому мы используем методы обеспечения безопасности корпоративного уровня.">
                        <div class="card__title">
                            <p class="animate-text" id="animate-text4">Шифрование</p>
                        </div>
                        <div class="card__image">
                            <img class="files-icon" src="/img/files.png" alt="files-icon">
                        </div>
                    </div>
                </div>
            </div>

           
        </div>`
    };

    positions.forEach(({x, y, z, rx, ry, contentId}) => {
        const face = createFace(contentId); // Используем готовый HTML контент
        face.position.set(x, y, z);
        face.rotation.y = ry;
        face.rotation.x = rx;
        facesGroup.add(face);
    });
    // facesGroup.scale.set(0.0017, 0.00205, 0.0018);
    // facesGroup.scale.set(0.00168, 0.00168, 0.00168);

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

    loadModel(cube, "new_cube.glb");
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
    function requestIdleCallbackPolyfill(cb) {
        setTimeout(cb, 100);
    }

    window.requestIdleCallback = window.requestIdleCallback || requestIdleCallbackPolyfill;

    function loadThreeModules() {
        if (threeModulesLoaded) return;
        threeModulesLoaded = true;

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
                    cssRenderer.render(scene, camera);
                } else {
                    cssRenderer.render(scene, camera);
                    renderer.render(scene, camera);
                }

                renderer.shadowMap.enabled = false;
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

        // Mouse down handler
        cssRenderer.domElement.addEventListener('mousedown', (event) => {
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

        // Mouse move handler
        cssRenderer.domElement.addEventListener('mousemove', (event) => {
            isActive = true;
            animate();

            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects([cube]);

            if (intersects.length === 0) {
                cssRenderer.domElement.style.cursor = 'default';
            } else {
                cssRenderer.domElement.style.cursor = 'pointer';
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

        cssRenderer.domElement.addEventListener('mouseup', stopDragging);
        cssRenderer.domElement.addEventListener('mouseleave', stopDragging);

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
        cssRenderer.render(scene, camera);
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

    cubeGroup.add(cube);  // Темно-серый куб
    cubeGroup.add(facesGroup); // HTML-грани

    scene.add(cubeGroup);
    cubeGroup.scale.setScalar(baseScale * interactionScale);

    // Создаем FPS-счетчик
    setupDebug(camera, cube);

    setTimeout(() => {
        const securityText = document.getElementById("security-text");
        const cardsContainer = document.querySelector(".security-box .cards");

        if (!securityText || !cardsContainer) {
            console.error("Не найден .security-box или security-text");
            return;
        }

        cardsContainer.addEventListener("mouseover", function (event) {
            const card = event.target.closest(".card");
            if (card && card.dataset.text) {
                securityText.textContent = card.dataset.text;
                securityText.style.opacity = "1";
            }
        });

        cardsContainer.addEventListener("mouseout", function (event) {
            const card = event.target.closest(".card");
            if (card) {
                securityText.style.opacity = "0";
            }
        });
    }, 300);
})

