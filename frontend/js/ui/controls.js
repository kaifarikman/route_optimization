import { store } from '../state/store.js';
import { buildRoute } from '../features/build-route.js';
import { optimizeRoute } from '../features/optimize-route.js';

export function initControls() {
    const buildRouteBtn = document.getElementById('buildRouteBtn');
    const optimizeRouteBtn = document.getElementById('optimizeRouteBtn');
    const generateBtn = document.getElementById('generateBtn');
    const clearPointsBtn = document.getElementById('clearPointsBtn');

    const allButtons = [buildRouteBtn, optimizeRouteBtn, generateBtn, clearPointsBtn].filter(Boolean);

    if (buildRouteBtn && !buildRouteBtn.dataset.bound) {
        buildRouteBtn.addEventListener('click', async () => {
            const { baseRoute, isLoading } = store.getState();
            if (isLoading) return;

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
            const { optimizedRoute, isLoading } = store.getState();
            if (isLoading) return;

            if (optimizedRoute) {
                store.setState({ selectedRouteMode: 'optimized' });
                return;
            }

            await optimizeRoute();
        });
        optimizeRouteBtn.dataset.bound = 'true';
    }

    store.subscribe((state) => {
        // Управление состояниями loading и disabled
        allButtons.forEach(btn => {
            if (btn) {
                btn.disabled = state.isLoading;

                // Меняем текст кнопки в зависимости от текущего активного действия
                if (state.isLoading) {
                    if (btn.id === 'generateBtn' && state.loadingAction === 'generate') btn.textContent = 'Генерация...';
                    if (btn.id === 'clearPointsBtn' && state.loadingAction === 'clear') btn.textContent = 'Очистка...';
                    if (btn.id === 'buildRouteBtn' && state.loadingAction === 'build') btn.textContent = 'Построение...';
                    if (btn.id === 'optimizeRouteBtn' && state.loadingAction === 'optimize') btn.textContent = 'Оптимизация...';
                } else {
                    // Возвращаем стандартный текст, когда загрузка завершена
                    if (btn.id === 'generateBtn') btn.textContent = 'Сгенерировать точки';
                    if (btn.id === 'clearPointsBtn') btn.textContent = 'Сбросить точки';
                    if (btn.id === 'buildRouteBtn') btn.textContent = 'Построить маршрут';
                    if (btn.id === 'optimizeRouteBtn') btn.textContent = 'Оптимизировать';
                }
            }
        });

        const baseCard = buildRouteBtn?.closest('.card');
        const optCard = optimizeRouteBtn?.closest('.card');

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
}import { store } from '../state/store.js';
import { buildRoute } from '../features/build-route.js';
import { optimizeRoute } from '../features/optimize-route.js';

export function initControls() {
    const buildRouteBtn = document.getElementById('buildRouteBtn');
    const optimizeRouteBtn = document.getElementById('optimizeRouteBtn');
    const generateBtn = document.getElementById('generateBtn');
    const clearPointsBtn = document.getElementById('clearPointsBtn');

    const allButtons = [buildRouteBtn, optimizeRouteBtn, generateBtn, clearPointsBtn].filter(Boolean);


if (buildRouteBtn && !buildRouteBtn.dataset.bound) {
        buildRouteBtn.addEventListener('click', async () => {
            const { baseRoute, isLoading } = store.getState();
            if (isLoading) return;

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
            const { optimizedRoute, isLoading } = store.getState();
            if (isLoading) return;

            if (optimizedRoute) {
                store.setState({ selectedRouteMode: 'optimized' });
                return;
            }

            await optimizeRoute();
        });
        optimizeRouteBtn.dataset.bound = 'true';
    }

    store.subscribe((state) => {
        // Управление состояниями loading и disabled
        allButtons.forEach(btn => {
            if (btn) {
                btn.disabled = state.isLoading;

                // Меняем текст кнопки в зависимости от текущего активного действия
                if (state.isLoading) {
                    if (btn.id === 'generateBtn' && state.loadingAction === 'generate') btn.textContent = 'Генерация...';
                    if (btn.id === 'clearPointsBtn' && state.loadingAction === 'clear') btn.textContent = 'Очистка...';
                    if (btn.id === 'buildRouteBtn' && state.loadingAction === 'build') btn.textContent = 'Построение...';
                    if (btn.id === 'optimizeRouteBtn' && state.loadingAction === 'optimize') btn.textContent = 'Оптимизация...';
                } else {
                    // Возвращаем стандартный текст, когда загрузка завершена
                    if (btn.id === 'generateBtn') btn.textContent = 'Сгенерировать точки';
                    if (btn.id === 'clearPointsBtn') btn.textContent = 'Сбросить точки';
                    if (btn.id === 'buildRouteBtn') btn.textContent = 'Построить маршрут';
                    if (btn.id === 'optimizeRouteBtn') btn.textContent = 'Оптимизировать';
                }
            }
        });

        const baseCard = buildRouteBtn?.closest('.card');
        const optCard = optimizeRouteBtn?.closest('.card');

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


