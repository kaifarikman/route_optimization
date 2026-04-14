import { store } from '../state/store.js';

export function initControls() {
    const baseCard = document.getElementById('buildRouteBtn')?.closest('.card');
    const optCard = document.getElementById('optimizeRouteBtn')?.closest('.card');

    if (baseCard) {
        baseCard.style.cursor = 'pointer';
        baseCard.addEventListener('click', (e) => {
            if (store.getState().baseRoute) {
                store.setState({ selectedRouteMode: 'base' });
            }
        });
    }

    if (optCard) {
        optCard.style.cursor = 'pointer';
        optCard.addEventListener('click', () => {
            if (store.getState().optimizedRoute) {
                store.setState({ selectedRouteMode: 'optimized' });
            }
        });
    }
}