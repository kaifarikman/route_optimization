import { store } from '../state/store.js';

export function initControls() {
    //Подписываемся на store, чтобы визуально подсвечивать активный режим
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