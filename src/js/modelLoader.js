// import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
// import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
// export function loadModel(cube, modelPath, applyDefaultMaterial, addPlanesToCube) {
//     const loader = new GLTFLoader();
//
//     // Указываем MeshoptDecoder
//     loader.setMeshoptDecoder(MeshoptDecoder);
//     loader.load(
//         `models/${modelPath}`,
//         (gltf) => {
//             const model = gltf.scene;
//             if (!model) {
//                 return console.error("Ошибка: Модель не загружена!");
//             }
//             applyDefaultMaterial(model);
//             addPlanesToCube(cube);
//             cube.add(model);
//             console.log(`Модель ${modelPath} загружена`);
//         },
//         undefined,
//         (error) => console.error(`Ошибка загрузки модели ${modelPath}:`, error)
//     );
// }

import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {addPlanesToCube, applyDefaultMaterial} from "./functions.js";

export function loadModel(cube, modelPath) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    loader.load(
        `models/${modelPath}`,
        (gltf) => {
            const model = gltf.scene;

            console.log(model);

            applyDefaultMaterial(model);
            addPlanesToCube(cube);

            cube.add(model);
        },
        undefined,
        (error) => console.error(`Ошибка загрузки модели ${modelPath}:`, error)
    );
}
