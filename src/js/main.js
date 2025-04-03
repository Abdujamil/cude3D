import {Raycaster, Vector2, Fog, Object3D, Group, MathUtils} from 'three/src/Three.js';
import {scene, camera, renderer, controls, cssRenderer} from './scene.js';
import {getRotationPercentage, initialQuaternion, loadEnvironment} from './functions.js';
import {loadModel} from "./modelLoader.js";
import {setupDebug} from "./debug.js";
import {setupPostProcessing} from "./postProcessing.js";
import {settings} from "./config.js";
import {CSS3DObject} from "three/addons/renderers/CSS3DRenderer.js";
import {GUI} from "lil-gui";
import $ from "jquery";
import "jquery.easing";
import VanillaTilt from "vanilla-tilt";

import {ceil} from "three/tsl";
import {flattenJSON} from "three/src/animation/AnimationUtils.js";

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


    // if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
    //     // Специфическое исправление для iOS
    //     const positions = [
    //         {x: 0, y: -1, z: 484, rx: 0, ry: 0, contentId: "front-content"}, // microphone
    //         {x: 1, y: -1, z: -485, rx: 0, ry: Math.PI, contentId: "back-content"}, //  Export
    //         {x: -510, y: -1, z: -1, rx: 0, ry: -Math.PI / 2, contentId: "left-content"}, // react
    //         {x: 510, y: -1, z: 0, rx: 0, ry: Math.PI / 2, contentId: "right-content"}, // security
    //     ];
    // }

    // Позиции граней
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    // v-base
    const positions = [
        {x: 0, y: 0, z: 483.5, rx: 0, ry: 0, contentId: "front-content"}, // microphone
        {x: 1, y: -1, z: -485, rx: 0, ry: Math.PI, contentId: "back-content"}, //  Export
        {x: -511, y: -1, z: -1, rx: 0, ry: -Math.PI / 2, contentId: "left-content"}, // react
        {x: 510, y: -1, z: 0, rx: 0, ry: Math.PI / 2, contentId: "right-content"}, // security
    ];

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

    // Создаем HTML-элементы для граней куба
    let currentFace = null;
    let faces = [];

    function createFace(contentId) {
        const div = document.createElement("div");
        div.style.backdropFilter = `blur(${settings.backgroundBlur}px)`;
        div.style.background = 'rgba(5,5,5,0.4)';
        div.style.border = `1px solid ${settings.borderColor}`;
        div.style.height = "520px";
        div.style.padding = "40px";
        div.innerHTML = contentHTML[contentId];
        div.style.overflow = "hidden";
        div.style.willChange = "transform, opacity";
        let object = new CSS3DObject(div);
        faces.push(object);
        currentFace = object;
        return currentFace;
    }

    // function updateBlur() {
    //     faces.forEach(face => {
    //         face.element.style.backdropFilter = `blur(${settings.backgroundBlur}px)`;
    //         face.element.style.border = `1px solid ${settings.borderColor}`;
    //     });
    // }

    const contentHTML = {
        "front-content": `
            <div class="box micro-box">
             <div class="box__img">
                <img rel="preload" src="/img/micrafon/0.png" alt="microphone"/></a>
            </div>
            <div class="box__content">
                <ul class="text-list">
                    <li>
                        <img src="/img/done.svg" alt="done icon">
                        <p>Стоимость минуты от 1 рубля.</p>
                    </li>
                    <li>
                        <img src="/img/done.svg" alt="done icon">
                        <p>Посекундная тарификация.</p>
                    </li>
                    <li>
                        <img src="/img/done.svg" alt="done icon">
                        <p>Дарите минуты в подарок.</p>
                    </li>
                    <li>
                        <img src="/img/done.svg" alt="done icon">
                        <p>Покупайте минуты на другой аккаунт.</p>
                    </li>
                    <li>
                        <img src="/img/done.svg" alt="done icon">
                        <p>Делитесь своими минутами.</p>
                    </li>
                    <li>
                        <img src="/img/done.svg" alt="done icon">
                        <p>Пополнение картой, QR-кодом, СБП.</p>
                    </li>
                    <li>
                        <img src="/img/done.svg" alt="done icon">
                        <p>Пополнение балансом телефона. </p>
                    </li>
                    <li>
                        <img src="/img/done.svg" alt="done icon">
                        <p>Пополнение с расчётного счёта.</p>
                    </li>
                    <li>
                        <img src="/img/done.svg" alt="done icon">
                        <p>Постоплата, рассрочка платежа.</p>
                    </li>
                </ul>
            </div>
        </div>
            `,
        "back-content": `
           <div class="box security-box">
               <div class="security-box__container">
                    <div class="box__title">
                        <h2>Безупречная защита</h2>
                    </div>
                    <div class="box__content">
                        <div class="cards">
                            <div class="cards__top">
                               <div class="tilt-cont">
                                    <div class="tilt" 
                                        data-text="Данные автоматически сохраняются на наших серверах посредством облачных резервных копий с усовершенствованным шифрованием  и надежными протоколами хранения.">
                                           <div class="tilt-inner" >
                                               <p>Резервное копирование</p>
                                                 
                                                      <div class="card__image-file card__image">
                                                   <img src="/img/2.svg" alt="file-icon">
                                                </div>
                                           </div>
                                    </div>
                               </div>
                               <div class="tilt-cont">
                                    <div class="tilt" 
                                            data-text="Все аккаунты имеют требования аутентификации,чтобы защитить в вашем личном кабинете. Мы не передаём баши данные третьим лицам.">
                                            <div class="tilt-inner">
                                                <p>Шифрование</p>
                                                <div class="card__image-person card__image">
                                                <img src="/img/4.svg" alt="file-icon">
                                              </div>
                                            </div>
                                       </div>
                               </div>       
                            </div>
                            <div class="cards__bottom">
                                <div class="tilt-cont">
                                     <div class="tilt" data-text="Передаваемые данные шифруются с использованием TLS 12+, а при хранении — с использованием стандартного алгоритма AE5–256.">
                                                <div class="tilt-inner">
                                                    <p>Доступ и хранение</p>
                                                    
                                                    
                                                    <div class="card__image-lock card__image">
                                                   <img src="/img/1.svg" alt="lock-icon">
                                               </div>
                                                </div>
                                    </div>
                                </div>
                                <div class="tilt-cont">
                                    <div class="tilt" data-text="Защита данных пользователей — высший приоритет для нас, поэтому мы используем методы обеспечения безопасности корпоративного уровня.">
                                        <div class="tilt-inner">
                                           <p>Безопасность</p>
                                            
                                               <div class="card__image-search card__image">
                                                       <img src="/img/3.svg" alt="file-icon">
                                                    </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="security-box__text">
                        <p id="security-text">
                            Данные автоматически сохраняются на наших серверах посредством облачных резервных копий с усовершенствованным шифрованием  и надежными протоколами хранения.
                        </p>
                    </div>
                </div>
            </div>
          `,
        "left-content": `
        <div class="box export-box">
            <div class="export-box__container">
                <div class="box__title">
                    <h2>Экспорт файла</h2>
                </div>
                <div class="box__content">
                    <div class="cards">
                        <div class="cardWrap">
                            <div class="card">
                                <div class="cardBg card__image" style="background-image: url('/img/word-icon.svg');">
                                    <div class="card__title cardInfo">
                                    <h3>DOCX</h3>
                                    <p>MS Word</p>
                                </div>
                                </div>
                            </div>
                        </div>
                        <div class="cardWrap"> 
                            <div class="card">
                                <div class="cardBg card__image" style="background-image: url('/img/excel-icon.svg');">
                                    <div class="card__title cardInfo">
                                    <h3>XLSX</h3>
                                    <p>MS Excel </p>
                                </div>
                                </div>
                            </div>
                        </div>
                        <div class="cardWrap">
                            <div class="card">
                                <div class="cardBg card__image" style="background-image: url('/img/pdf-icon.svg');">
                                    <div class="card__title cardInfo">
                                    <h3>PDF</h3>
                                    <p >Документ</p>
                                </div>
                                </div>
                            </div>
                        </div>
                        <div class="cardWrap">
                            <div class="card">
                                <div class="cardBg card__image" style="background-image: url('/img/txt-icon.webp');" >
                                    <div class="card__title cardInfo">
                                        <h3>TXT</h3>
                                        <p>Блокнот</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="cardWrap">
                            <div class="card">
                                <div class="cardBg card__image" style="background-image: url('/img/srt-icon.svg');" >
                                    <div class="card__title cardInfo">
                                        <h3>SRT</h3>
                                        <p>Субтитры</p>
                                    </div>
                                </div>
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
        </div>
           `,
        "right-content": `
            <div class="box support-lan-box" xmlns="http://www.w3.org/1999/html">
                <div class="support-lan-box__cont">
                   
                    <div class="support-lan-box__container">
                    <div class="loading">    
                      <section>
                          <div class="cube center nucleus">
                            <div class="cube-container">
                            <div class="cube-track">
                                <div class="cube">NL</div>
                                <div class="cube">JA</div>
                                <div class="cube">IT</div>
                                <div class="cube">EN</div>
                                <div class="cube">ES</div>
                                <div class="cube">PT</div>
                                <div class="cube">FR</div>
                                <div class="cube">DE</div>
                                <div class="cube">AF</div>
                                <div class="cube">SQ</div>
                                <div class="cube">AM</div>
                                <div class="cube">AR</div>
                                <div class="cube">HY</div>
                                <div class="cube">AS</div>
                                <div class="cube">AZ</div>
                                <div class="cube">BA</div>
                                <div class="cube">EU</div>
                                <div class="cube">BE</div>
                                <div class="cube">BN</div>
                                <div class="cube">BS</div>
                                <div class="cube">BR</div>
                                <div class="cube">BG</div>
                                <div class="cube">MY</div>
                                <div class="cube">CA</div>
                                <div class="cube">ZH</div>
                                <div class="cube">HR</div>
                                <div class="cube">CS</div>
                                <div class="cube">DA</div>
                                <div class="cube">ET</div>
                                <div class="cube">FO</div>
                                <div class="cube">FI</div>
                                <div class="cube">GL</div>
                                <div class="cube">KA</div>
                                <div class="cube">EL</div>
                                <div class="cube">GU</div>
                                <div class="cube">HT</div>
                                <div class="cube">HA</div>
                                <div class="cube">HAW</div>
                                <div class="cube">HE</div>
                                <div class="cube">HI</div>
                                <div class="cube">HU</div>
                                <div class="cube">IS</div>
                                <div class="cube">ID</div>
                                <div class="cube">JV</div>
                                <div class="cube">KN</div>
                                <div class="cube">KK</div>
                                <div class="cube">KM</div>
                                <div class="cube">KO</div>
                                <div class="cube">LO</div>
                                <div class="cube">LA</div>
                                <div class="cube">LV</div>
                                <div class="cube">LB</div>
                                <div class="cube">LN</div>
                                <div class="cube">LT</div>
                                <div class="cube">MK</div>
                                <div class="cube">MG</div>
                                <div class="cube">MS</div>
                                <div class="cube">ML</div>
                                <div class="cube">MT</div>
                                <div class="cube">MI</div>
                                <div class="cube">MR</div>
                                <div class="cube">MN</div>
                                <div class="cube">NE</div>
                                <div class="cube">NO</div>
                                <div class="cube">NN</div>
                                <div class="cube">OC</div>
                                <div class="cube">PA</div>
                                <div class="cube">PS</div>
                                <div class="cube">FA</div>
                                <div class="cube">PL</div>
                                <div class="cube">RO</div>
                                <div class="cube">RU</div>
                                <div class="cube">SA</div>
                                <div class="cube">SR</div>
                                <div class="cube">SN</div>
                                <div class="cube">SD</div>
                                <div class="cube">SI</div>
                                <div class="cube">SK</div>
                                <div class="cube">SL</div>
                                <div class="cube">SO</div>
                                <div class="cube">SU</div>
                                <div class="cube">SW</div>
                                <div class="cube">SV</div>
                                <div class="cube">TL</div>
                                <div class="cube">TG</div>
                                <div class="cube">TA</div>
                                <div class="cube">TT</div>
                                <div class="cube">TE</div>
                                <div class="cube">TH</div>
                                <div class="cube">BO</div>
                                <div class="cube">TR</div>
                                <div class="cube">TK</div>
                                <div class="cube">UK</div>
                                <div class="cube">UR</div>
                                <div class="cube">UZ</div>
                                <div class="cube">VI</div>
                                <div class="cube">CY</div>
                                <div class="cube">YI</div>
                                <div class="cube">YO</div>
                            </div>
                            </div>
                          </div>
                           
                          <article class="ring1">
                            <div class="r-anim"></div>
                          </article>
                          <article class="ring2">
                            <div class="r-anim"></div>
                          </article>
                          <article class="ring3">
                            <div class="r-anim"></div>
                          </article>
                      </section>
                    </div>
                    <div class="box__text">
                   
                    <div class="text-content">
                         <div class="title">
                             <h2>Поддерживаемые языки</h2>
                         </div>
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
                </div> 
                </div>
                </div>
            </div>
            `
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

    // loadMicrophoneModel(cube, "microphone.glb");
    loadModel(cube, "new_cube.glb");
    initialQuaternion.copy(cube.quaternion);


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

        //Image update(microphone)
        let targetRotationY = cubeGroup.rotation.y; // Целевая ротация
        let currentRotationY = cubeGroup.rotation.y; // Текущее значение
        let lastRotationY = cubeGroup.rotation.y;

        let lastIndex = 0; // Переменная для последнего индекса картинки
        let maxRotationLimit = 1; // Максимальный индекс для поворота вправо
        let minRotationLimit = -1; // Минимальный индекс для поворота влево

        let previousRotationY = currentRotationY; // Предыдущий угол для отслеживания направления вращения

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

        // magic360
        // const magicElement = document.querySelector('.Magic360');

        // Переменные для контроля вращения
        let isSpinning = false;
        let spinVelocity = 0;
        let lastMoveTime = performance.now();
        const spinDecay = 0.96; // Коэффициент замедления

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

        // Mouse move handler
        cssRenderer.domElement.addEventListener('mousemove', (event) => {
            isActive = true;
            animate();

            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);

            const intersects = raycaster.intersectObjects([cube]);

            if (intersects.length === 0) {
                isActive = true
                renderer.domElement.style.cursor = 'default';
                cssRenderer.domElement.style.cursor = 'default';

            } else {
                isActive = true
                renderer.domElement.style.cursor = 'pointer';
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

            if (spinVelocity !== 0) {
                isSpinning = true;
                updateSpin(); // Запускаем плавное замедление
            }
        };
        cssRenderer.domElement.addEventListener('mouseup', stopDragging);
        cssRenderer.domElement.addEventListener('mouseleave', stopDragging);

        // for mobile version
        if (window.innerWidth < 768) {
            // Обработчик касания (аналоzг mousedown)
            cssRenderer.domElement.addEventListener('touchstart', (event) => {
                isActive = true;
                animate();

                const touch = event.touches[0];
                mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects([cube]);

                if (intersects.length > 0) {
                    animateScale(settings.scaleSmall);
                    isDragging = true;
                    lastMousePosition = {x: touch.clientX, y: touch.clientY};
                }
            });

            // Обработчик перемещения пальцем (аналог mousemove)
            cssRenderer.domElement.addEventListener('touchmove', (event) => {
                if (!isDragging) return;

                isActive = true;
                animate();

                const touch = event.touches[0];
                deltaMove.x = Math.min(touch.clientX - lastMousePosition.x, 30);

                lastMousePosition = {x: touch.clientX, y: touch.clientY};

                const sensitivity = settings.sensitivity;
                const rotationSpeed = settings.rotationSpeed;

                targetRotationY = settings.durationRotate * 1.8 * rotationSpeed * sensitivity * Math.sign(deltaMove.x);

                if (!inertia || Math.sign(rotationVelocityAdd) !== Math.sign(deltaMove.x)) {
                    rotationVelocityAdd = 0.01 * Math.sign(deltaMove.x);
                }

                rotationVelocity = targetRotationY;
                dragStartTime = performance.now();
                inertia = true;

                // Привязываем Magic360 к движению куба
                if (magicElement && typeof Magic360 !== "undefined") {
                    let spinSpeed = 0.5;
                    spinVelocity = deltaMove.x * spinSpeed;
                    lastMoveTime = performance.now();
                    Magic360.spin(magicElement, spinVelocity);
                }

                event.preventDefault(); // Предотвращает скролл страницы при свайпе
            }, {passive: false});

            // Обработчик окончания касания (аналог mouseup)
            cssRenderer.domElement.addEventListener('touchend', () => {
                animateScale(1);
                isDragging = false;

                if (spinVelocity !== 0) {
                    isSpinning = true;
                    updateSpin(); // Запускаем плавное замедление
                }
            });
        }

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
                isActive = true;
                animate();

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

        const rotations = [
            0,                // 1-я грань (0°)
            Math.PI / 2,      // 2-я грань (90°)
            Math.PI,          // 3-я грань (180°)
            (3 * Math.PI) / 2 // 4-я грань (270°)
        ];
        // Добавляем клик по квадратикам (дополнительно к mousemove)
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault(); // Предотвращаем переход по ссылке

                const itemLeft = item.offsetLeft; // Берем позицию квадратика
                // const offset = 61.8; // Смещаем на 20px левее
                const offset = 11.8;
                animateToPosition(itemLeft - offset); // Запускаем анимацию с учетом смещения
            });
        });

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
    // Вызовем рендеринг сразу, например, через небольшую задержку
    setTimeout(() => {
        renderOnce();
    }, 220); // 600 миллисекунд, можно сразу после загрузки страницы

    cubeGroup.add(cube);  // Темно-серый куб
    cubeGroup.add(facesGroup); // HTML-грани

    scene.add(cubeGroup);
    cubeGroup.scale.setScalar(baseScale * interactionScale);

    // Создаем FPS-счетчик
    setupDebug(camera, cube);

    setTimeout(() => {
        // const electrons = document.querySelectorAll('.electron img'); // Берем все изображения
        // const arcs = document.querySelectorAll('.arc'); // Берем все орбиты (они анимируются)
        //
        // const icons = [
        //     {'url': '/img/lang1.png'},
        //     {'url': '/img/lang1.png'},
        //     {'url': '/img/lang2.png'},
        //     {'url': '/img/lang3.png'},
        //     {'url': '/img/lang4.png'},
        //     {'url': '/img/lang5.png'},
        //     {'url': '/img/lang6.png'},
        //     {'url': '/img/lang7.png'},
        //     {'url': '/img/lang8.png'},
        // ];
        //
        // let currentIndexes = [0, 1, 2]; // Индексы текущих иконок
        //
        // arcs.forEach((arc, i) => {
        //     arc.addEventListener('animationiteration', () => { // Когда орбита завершила оборот
        //         electrons[i].style.opacity = '0'; // Плавно исчезает перед сменой
        //
        //         setTimeout(() => {
        //             currentIndexes[i] = (currentIndexes[i] + 1) % icons.length; // Берем следующую иконку
        //             electrons[i].src = icons[currentIndexes[i]].url; // Меняем картинку
        //             electrons[i].style.opacity = '1'; // Плавно появляется
        //         }, 800); // Небольшая задержка для плавности смены
        //     });
        // });

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

        // Cube random change icon
        // const faces = document.querySelectorAll(".face img"); // Получаем все картинки на кубе
        // function getRandomIcon() {
        //     return icons[Math.floor(Math.random() * icons.length)].url; // Берём случайный URL
        // }
        //
        // function updateCubeImages() {
        //     faces.forEach(face => {
        //         face.src = getRandomIcon(); // Меняем src картинки
        //     });
        // }
        //
        // setInterval(updateCubeImages, 2000);

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

        //Animate text atom
        function bounceElement($element, startPosition = "0px", endPosition = "30px", duration = 300) {
            $element.stop(true, true).css("top", startPosition).animate(
                {top: endPosition},
                {duration: duration, easing: "easeOutBounce"}
            ).animate(
                {top: startPosition},
                {duration: duration, easing: "easeInBounce"}
            );
        }

        // const ui = document.getElementById("ui");
        // const ui = document.querySelector(".cube");
        // const languages = ["NL", "JPN", "ITA", "EN", "ESP", "PTB", "FRA", "DEU"];
        // let currentIndex = 0;
        // const animationDuration = 2500; // Время между сменами языка
        //
        // let div = document.createElement("div");
        // div.className = "text";
        // div.textContent = languages[currentIndex];
        // ui.appendChild(div);
        //
        // function changeLanguage() {
        //     let $text = $(".text");
        //
        //     // Запускаем эффект подпрыгивания
        //     bounceElement($text, "0px", "-100px", 500);
        //
        //     setTimeout(() => {
        //         currentIndex = (currentIndex + 1) % languages.length;
        //         $text.text(languages[currentIndex]); // Меняем язык
        //     }, 300); // После прыжка меняем текст
        // }

        // setInterval(changeLanguage, animationDuration);

        //Atom script for hover delay
        // const section = document.querySelector("section");
        // let hoverTimer;
        // section.addEventListener("mouseenter", () => {
        //     hoverTimer = setTimeout(() => {
        //         section.classList.add("hover-active");
        //     }, 300); // Ждём 2 секунды перед запуском
        // });
        // section.addEventListener("mouseleave", () => {
        //     clearTimeout(hoverTimer); // Если пользователь ушел раньше 2 секунд, отменяем таймер
        //     section.classList.remove("hover-active"); // Можно убрать, если нужно сбрасывать анимацию
        // });

    }, 250);
})

