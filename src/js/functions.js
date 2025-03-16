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
import {settings} from "./config.js";

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

    const createPlane = (contentId, width, height) => {
        const div = document.createElement('div');
        div.innerHTML = contentHTML[contentId];
        div.style.width = `${width}px`;
        div.style.height = `${height}px`;
        div.style.background = 'rgba(255, 255, 255, 0.2)';
        // div.style.border = '1px solid black';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.fontSize = '20px';

        return new CSS3DObject(div);
    };

    // Размеры HTML-элемента (настраивай под размер куба)
    const width = 705, height = 865;

    // Создаем 4 стороны
    const planeFront = createPlane('front-content', width, height);
    planeFront.position.set(0, -0.006, .8909); // Чуть перед кубом
    planeFront.scale.set(0.00253, 0.0012, 0.1);

    const planeBack = createPlane('back-content', width, height);
    planeBack.position.set(0, -0.006, -.8909);
    planeBack.rotation.y = Math.PI; // Разворачиваем
    planeBack.scale.set(0.00253, 0.0012, 0.1);

    const planeLeft = createPlane('left-content', width, height);
    planeLeft.position.set(-.8909, -0.006, 0);
    planeLeft.rotation.y = Math.PI / 2;
    planeLeft.scale.set(0.00253, 0.0012, 0.1);

    const planeRight = createPlane('right-content', width, height);
    planeRight.position.set(.8909, -0.006, 0);
    planeRight.rotation.y = -Math.PI / 2;
    planeRight.scale.set(0.00253, 0.0012, 0.1);

    // Добавляем к сцене
    cubeObject.add(planeFront, planeBack, planeLeft, planeRight);
}

// export function applyDefaultMaterial(model) {
//     const defaultMaterial = new MeshPhysicalMaterial({
//         color: 0x000000,
//         reflectivity: 0,
//         metalness: 0,
//         roughness: 0,
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
            child.material.transparent = true;
            child.material.color.set(0x000000);
            child.material.reflectivity = 0;
            child.material.opacity = 0.4; // Устанавливаем прозрачность

            // child.material.depthWrite = false;
            // child.material.emissiveIntensity = 0;
            // child.material.needsUpdate = true; // Обновляем материал
            // child.material.side = DoubleSide; // Если у вас односторонний материал
            // child.renderOrder = 1;
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