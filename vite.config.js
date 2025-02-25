// import {defineConfig} from 'vite';
// import compression from 'vite-plugin-compression';
// import {visualizer} from "rollup-plugin-visualizer";
// import { ViteMinifyPlugin } from 'vite-plugin-minify'
//
// export default defineConfig({
//     build: {
//         target: 'esnext',
//         // modulePreload: false,
//         treeshake: true,
//         minify: 'esbuild', // ⚡ Esbuild быстрее
//         logLevel: 'info',
//         // resolve: {
//         //     alias: {
//         //         'three': 'three/build/three.module.min.js'
//         //     }
//         // },
//         esbuild: {
//             treeShaking: true,
//             drop: ['console', 'debugger'], // Убираем console.log и debugger
//             pure: ['console.log'] // Полностью удаляет console.log
//         },
//         rollupOptions: {
//             treeshake: {
//                 preset: 'smallest',
//                 moduleSideEffects: (id) => {
//                     return id.includes('three') ? false : undefined;
//                 }
//             },
//             output: {
//                 manualChunks(id) {
//                     if (id.includes('node_modules')) {
//                         if (id.includes('three')) return 'three';
//                         if (id.includes('dat.gui')) return 'dat-gui';
//                         if (id.includes('OrbitControls')) return 'orbit-controls';
//                         if (id.includes('GLTFLoader')) return 'gltf-loader';
//                         if (id.includes('stats.js')) return 'stats';
//                         return 'vendor';
//                     }
//                 },
//             }
//         },
//         chunkSizeWarningLimit: 500,
//     },
//     plugins: [
//         ViteMinifyPlugin({}),
//         visualizer({open: true}),
//         compression({algorithm: 'brotliCompress'}),
//         compression({algorithm: 'gzip'}),
//     ]
// });

import {defineConfig} from 'vite';
import compression from 'vite-plugin-compression';
import {visualizer} from "rollup-plugin-visualizer";
import {ViteMinifyPlugin} from 'vite-plugin-minify';

export default defineConfig({
    build: {
        target: 'esnext',
        treeshake: true,
        minify: 'esbuild',
        logLevel: 'info',
        esbuild: {
            treeShaking: true,
            drop: ['console', 'debugger'],
            pure: ['console.log']
        },
        commonjsOptions: {
            ignoreTryCatch: false, // Удаляем неиспользуемый код внутри try/catch
        },
        rollupOptions: {
            treeshake: {
                preset: 'smallest',
                moduleSideEffects: (id) => {
                    return id.includes('three') ? false : undefined;
                }
            },
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('three/src/controls/OrbitControls')) return 'orbit-controls';
                        if (id.includes('three/src/loaders/GLTFLoader')) return 'gltf-loader';
                        if (id.includes('three/src/')) return 'three-core';
                        return 'vendor';
                    }
                }
            }
        },
        chunkSizeWarningLimit: 500,
    },
    plugins: [
        ViteMinifyPlugin({}),
        visualizer({open: true}),
        compression({algorithm: 'brotliCompress'}),
        compression({algorithm: 'gzip'}),
    ]
});
