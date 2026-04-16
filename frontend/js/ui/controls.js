import { store } from '../state/store.js';
import { buildRoute } from '../features/build-route.js';
import { optimizeRoute } from '../features/optimize-route.js';

export function initControls() {
    const buildRouteBtn = document.getElementById('buildRouteBtn');
    const optimizeRouteBtn = document.getElementById('optimizeRouteBtn');

    if (buildRouteBtn && !buildRouteBtn.dataset.bound) {
        buildRouteBtn.addEventListener('click', async () => {
            const { baseRoute } = store.getState();
            if (baseRoute) {
                store.setState({ selectedRouteMode: 'base' });
                return;
            }

            await buildRoute();
        });
        buildRouteBtn.dataset.bound = 'true';
    }

    if (optimizeRouteBtn && !optimizeRouteBtn.dataset.bound) {
        optimizeRouteBtn.addEventListener('click', async () => {
            const { optimizedRoute } = store.getState();
            if (optimizedRoute) {
                store.setState({ selectedRouteMode: 'optimized' });
                return;
            }

            await optimizeRoute();
        });
        optimizeRouteBtn.dataset.bound = 'true';
    }

    store.subscribe((state) => {
        const baseCard = document.getElementById('buildRouteBtn')?.closest('.card');
        const optCard = document.getElementById('optimizeRouteBtn')?.closest('.card');

        if (baseCard && optCard) {
            if (state.selectedRouteMode === 'base') {
                baseCard.style.border = '2px solid blue'; // Выделяем базовый
                optCard.style.border = '1px solid #ccc';
            } else if (state.selectedRouteMode === 'optimized') {
                optCard.style.border = '2px solid green'; // Выделяем оптимизированный
                baseCard.style.border = '1px solid #ccc';
            }
        }
    });
}
