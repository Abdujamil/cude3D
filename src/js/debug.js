import Stats from 'stats.js';
import {setupGUI} from './ui.js';

export function setupDebug(camera, cube) {
    // setupGUI(camera, cube);

    const stats = new Stats();
    stats.showPanel(0);
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '10px';
    stats.dom.style.left = '10px';
    document.body.appendChild(stats.dom);

    function animateStats() {
        stats.begin();
        requestAnimationFrame(animateStats);
        stats.end();
    }

    animateStats();
}
