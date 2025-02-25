import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';
import {GammaCorrectionShader} from 'three/addons/shaders/GammaCorrectionShader.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';

export function setupPostProcessing(renderer, scene, camera, enableSSAO = true, enableFXAA = true) {
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const pixelRatio = renderer.getPixelRatio();
    let fxaaPass, ssaoPass;

    if (enableFXAA) {
        fxaaPass = new ShaderPass(FXAAShader);
        fxaaPass.material.uniforms['resolution'].value.set(
            1 / (window.innerWidth * pixelRatio),
            1 / (window.innerHeight * pixelRatio)
        );
        composer.addPass(fxaaPass);
    }

    if (enableSSAO) {
        ssaoPass = new SSAOPass(scene, camera, window.innerWidth / 2, window.innerHeight / 2);
        composer.addPass(ssaoPass);
    }

    window.addEventListener('resize', () => {
        const width = window.innerWidth, height = window.innerHeight;
        composer.setSize(width, height);

        if (enableFXAA) {
            fxaaPass.uniforms['resolution'].value.set(1 / width, 1 / height);
        }
        if (enableSSAO) {
            ssaoPass.setSize(width, height);
        }
    });

    composer.addPass(new ShaderPass(GammaCorrectionShader));

    return composer;
}
