import { store } from '../state/store.js';
import { buildRoute } from '../features/build-route.js';
import { optimizeRoute } from '../features/optimize-route.js';
import { updateMetrics } from './metrics.js';

export function initControls() {
    const buildRouteBtn = document.getElementById('buildRouteBtn');
    const optimizeRouteBtn = document.getElementById('optimizeRouteBtn');
    const generateBtn = document.getElementById('generateBtn');
    const addPointBtn = document.getElementById('addPointBtn');
    const clearPointsBtn = document.getElementById('clearPointsBtn');
    const importPointsBtn = document.getElementById('importPointsBtn');

    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const exportSection = document.getElementById('export-section');

    const allButtons = [buildRouteBtn, optimizeRouteBtn, generateBtn, addPointBtn, clearPointsBtn, importPointsBtn].filter(Boolean);

    if (buildRouteBtn && !buildRouteBtn.dataset.bound) {
        buildRouteBtn.addEventListener('click', async () => {
            const { baseRoute, isLoading, sharedView } = store.getState();
            if (isLoading || sharedView) return;
            if (baseRoute) {
                store.setState({ selectedRouteMode: 'base' });
                updateMetrics(baseRoute, 'base');
                return;
            }
            await buildRoute();
        });
        buildRouteBtn.dataset.bound = 'true';
    }

    if (optimizeRouteBtn && !optimizeRouteBtn.dataset.bound) {
        optimizeRouteBtn.addEventListener('click', async () => {
            const { optimizedRoute, isLoading, sharedView } = store.getState();
            if (isLoading || sharedView) return;
            if (optimizedRoute) {
                store.setState({ selectedRouteMode: 'optimized' });
                updateMetrics(optimizedRoute, 'optimized');
                return;
            }
            await optimizeRoute();
        });
        optimizeRouteBtn.dataset.bound = 'true';
    }

    // Подписка на обновление реактивного состояния приложения
    store.subscribe((state) => {
        const hasPoints = state.points && state.points.length >= 2;
        const hasBaseRoute = !!state.baseRoute;
        const hasOptimizedRoute = !!state.optimizedRoute;
        const mutationsDisabled = state.isLoading || state.sharedView;

        // ── Управление активностью шагов (UI) ──
        if (step1 && step2 && step3) {
            // По умолчанию Шаг 1 активен всегда
            step1.classList.add('active');

            // Шаг 2 активен, если есть точки для маршрута
            if (hasPoints) {
                step2.classList.add('active');
            } else {
                step2.classList.remove('active');
            }

            // Шаг 3 активен, если построен базовый маршрут
            if (hasBaseRoute) {
                step3.classList.add('active');
            } else {
                step3.classList.remove('active');
            }
        }

        if (exportSection) {
            if (hasBaseRoute || hasOptimizedRoute) {
                exportSection.classList.add('active');
            } else {
                exportSection.classList.remove('active');
            }
        }

        // Блокировка/разблокировка кнопок управления
        if (buildRouteBtn) {
            if (!hasPoints || mutationsDisabled) {
                buildRouteBtn.setAttribute('disabled', 'true');
            } else {
                buildRouteBtn.removeAttribute('disabled');
            }
        }

        if (optimizeRouteBtn) {
            if (!hasBaseRoute || mutationsDisabled) {
                optimizeRouteBtn.setAttribute('disabled', 'true');
            } else {
                optimizeRouteBtn.removeAttribute('disabled');
            }
        }

        [generateBtn, addPointBtn, importPointsBtn].forEach(btn => {
            if (!btn) return;
            if (mutationsDisabled) {
                btn.setAttribute('disabled', 'true');
            } else {
                btn.removeAttribute('disabled');
            }
        });
        if (clearPointsBtn) {
            if (state.isLoading) {
                clearPointsBtn.setAttribute('disabled', 'true');
            } else {
                clearPointsBtn.removeAttribute('disabled');
            }
        }

        // Текстовые индикаторы загрузки внутри кнопок
        allButtons.forEach(btn => {
            if (btn && state.isLoading) {
                if (btn.id === 'generateBtn' && state.loadingAction === 'generate') btn.innerHTML = '<i class="ti ti-loader rotate"></i> Генерация...';
                if (btn.id === 'addPointBtn' && state.loadingAction === 'add') btn.innerHTML = '<i class="ti ti-loader rotate"></i> Добавление...';
                if (btn.id === 'importPointsBtn' && state.loadingAction === 'import') btn.innerHTML = '<i class="ti ti-loader rotate"></i> Импорт...';
                if (btn.id === 'clearPointsBtn' && state.loadingAction === 'clear') btn.innerHTML = '<i class="ti ti-loader rotate"></i> Сброс...';
                if (btn.id === 'buildRouteBtn' && state.loadingAction === 'build') btn.innerHTML = '<i class="ti ti-loader rotate"></i> Построение...';
                if (btn.id === 'optimizeRouteBtn' && state.loadingAction === 'optimize') btn.innerHTML = '<i class="ti ti-loader rotate"></i> Оптимизация...';
            } else if (btn) {
                if (btn.id === 'generateBtn') btn.innerHTML = '<i class="ti ti-map-pin-plus"></i> Сгенерировать';
                if (btn.id === 'addPointBtn') btn.innerHTML = '<i class="ti ti-map-pin-plus"></i> Добавить точку';
                if (btn.id === 'importPointsBtn') btn.innerHTML = '<i class="ti ti-upload"></i> Импорт точек';
                if (btn.id === 'clearPointsBtn') btn.innerHTML = '<i class="ti ti-refresh"></i> Новый маршрут';
                if (btn.id === 'buildRouteBtn') btn.innerHTML = '<i class="ti ti-route"></i> Построить маршрут';
                if (btn.id === 'optimizeRouteBtn') btn.innerHTML = '<i class="ti ti-bolt"></i> Оптимизировать';
            }
        });
    });
}
