import { store } from '../state/store.js';
import { buildRoute } from '../features/build-route.js';
import { optimizeRoute } from '../features/optimize-route.js';
import { updateMetrics, updateRouteOrder } from './metrics.js';
import { notify } from './notifications.js';
import { nextRouteToggleState, routeForMode, routeVisibilityState } from '../map/route-visibility.js?v=20260530-b2-addresses-v2';
import { MAP_STYLES, setMapStyle } from '../map/map.js?v=20260530-b2-addresses-v2';

function routeStateKey(route) {
    if (!route) return null;
    if (route.id) return `id:${route.id}`;
    if (route.point_ids) return `points:${route.point_ids.join(',')}`;
    if (route.points) return `points:${route.points.map(point => point.id || point).join(',')}`;
    return `metrics:${route.distance_km}:${route.duration_minutes}`;
}

export function initControls() {
    const buildRouteBtn = document.getElementById('buildRouteBtn');
    const optimizeRouteBtn = document.getElementById('optimizeRouteBtn');
    const generateBtn = document.getElementById('generateBtn');
    const centerGeocodeBtn = document.getElementById('centerGeocodeBtn');
    const addPointBtn = document.getElementById('addPointBtn');
    const manualGeocodeBtn = document.getElementById('manualGeocodeBtn');
    const mapClickAddBtn = document.getElementById('mapClickAddBtn');
    const clearPointsBtn = document.getElementById('clearPointsBtn');
    const importPointsBtn = document.getElementById('importPointsBtn');
    const routeTogglePanel = document.getElementById('routeTogglePanel');
    const baseRouteToggle = document.getElementById('baseRouteToggle');
    const optimizedRouteToggle = document.getElementById('optimizedRouteToggle');
    const mapStyleButtons = Array.from(document.querySelectorAll('[data-map-style]'));

    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const exportSection = document.getElementById('export-section');

    const allButtons = [buildRouteBtn, optimizeRouteBtn, generateBtn, centerGeocodeBtn, addPointBtn, manualGeocodeBtn, mapClickAddBtn, clearPointsBtn, importPointsBtn].filter(Boolean);
    let lastBaseRouteKey = null;
    let lastOptimizedRouteKey = null;

    if (buildRouteBtn && !buildRouteBtn.dataset.bound) {
        buildRouteBtn.addEventListener('click', async () => {
            const { baseRoute, isLoading, sharedView } = store.getState();
            if (isLoading || sharedView) return;
            if (baseRoute) {
                const visibility = routeVisibilityState(store.getState().routeVisibility);
                store.setState({
                    selectedRouteMode: 'base',
                    routeVisibility: { ...visibility, base: true },
                });
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
                const visibility = routeVisibilityState(store.getState().routeVisibility);
                store.setState({
                    selectedRouteMode: 'optimized',
                    routeVisibility: { ...visibility, optimized: true },
                });
                updateMetrics(optimizedRoute, 'optimized');
                return;
            }
            await optimizeRoute();
        });
        optimizeRouteBtn.dataset.bound = 'true';
    }

    if (mapClickAddBtn && !mapClickAddBtn.dataset.bound) {
        mapClickAddBtn.addEventListener('click', () => {
            const { isLoading, sharedView, mapClickAddMode } = store.getState();
            if (isLoading || sharedView) return;

            const nextMode = !mapClickAddMode;
            store.setState({ mapClickAddMode: nextMode });
            notify(
                nextMode ? 'Кликните по карте, чтобы добавить точку' : 'Добавление кликом выключено',
                'info',
            );
        });
        mapClickAddBtn.dataset.bound = 'true';
    }

    if (!document.body.dataset.mapClickEscapeBound) {
        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;
            if (!store.getState().mapClickAddMode) return;

            store.setState({ mapClickAddMode: false });
            notify('Добавление кликом выключено', 'info');
        });
        document.body.dataset.mapClickEscapeBound = 'true';
    }

    function bindRouteToggle(button, mode) {
        if (!button || button.dataset.bound) return;

        button.addEventListener('click', () => {
            const state = store.getState();
            const route = routeForMode(state, mode);
            if (state.isLoading || !route) return;

            const updates = nextRouteToggleState(state, mode);
            if (!updates) return;
            store.setState(updates);

            if (updates.selectedRouteMode) {
                updateMetrics(routeForMode(store.getState(), updates.selectedRouteMode), updates.selectedRouteMode);
            } else {
                updateRouteOrder(null);
            }
        });
        button.dataset.bound = 'true';
    }

    bindRouteToggle(baseRouteToggle, 'base');
    bindRouteToggle(optimizedRouteToggle, 'optimized');

    mapStyleButtons.forEach((button) => {
        if (button.dataset.bound) return;

        button.addEventListener('click', () => {
            const styleId = button.dataset.mapStyle;
            if (!MAP_STYLES[styleId]) return;
            setMapStyle(styleId);
        });
        button.dataset.bound = 'true';
    });

    // Подписка на обновление реактивного состояния приложения
    store.subscribe((state) => {
        const hasPoints = state.points && state.points.length >= 2;
        const hasBaseRoute = !!state.baseRoute;
        const hasOptimizedRoute = !!state.optimizedRoute;
        const mutationsDisabled = state.isLoading || state.sharedView;
        const routeVisibility = routeVisibilityState(state.routeVisibility);
        const baseRouteKey = routeStateKey(state.baseRoute);
        const optimizedRouteKey = routeStateKey(state.optimizedRoute);

        const visibilityUpdates = {};
        if (baseRouteKey && baseRouteKey !== lastBaseRouteKey && !routeVisibility.base) {
            visibilityUpdates.base = true;
        }
        if (optimizedRouteKey && optimizedRouteKey !== lastOptimizedRouteKey && !routeVisibility.optimized) {
            visibilityUpdates.optimized = true;
        }
        lastBaseRouteKey = baseRouteKey;
        lastOptimizedRouteKey = optimizedRouteKey;

        if (Object.keys(visibilityUpdates).length > 0) {
            store.setState({
                routeVisibility: {
                    ...routeVisibility,
                    ...visibilityUpdates,
                },
                selectedRouteMode: visibilityUpdates.optimized ? 'optimized' : state.selectedRouteMode,
            });
            return;
        }

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

        [generateBtn, centerGeocodeBtn, addPointBtn, manualGeocodeBtn, mapClickAddBtn, importPointsBtn].forEach(btn => {
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

        if (mapClickAddBtn) {
            mapClickAddBtn.classList.toggle('is-active', !!state.mapClickAddMode);
            mapClickAddBtn.setAttribute('aria-pressed', state.mapClickAddMode ? 'true' : 'false');
        }

        if (routeTogglePanel) {
            routeTogglePanel.hidden = !(hasBaseRoute || hasOptimizedRoute);
        }
        if (baseRouteToggle) {
            baseRouteToggle.hidden = !hasBaseRoute;
            baseRouteToggle.disabled = state.isLoading || !hasBaseRoute;
            baseRouteToggle.setAttribute('aria-pressed', routeVisibility.base && hasBaseRoute ? 'true' : 'false');
        }
        if (optimizedRouteToggle) {
            optimizedRouteToggle.hidden = !hasOptimizedRoute;
            optimizedRouteToggle.disabled = state.isLoading || !hasOptimizedRoute;
            optimizedRouteToggle.setAttribute('aria-pressed', routeVisibility.optimized && hasOptimizedRoute ? 'true' : 'false');
        }

        mapStyleButtons.forEach((button) => {
            const isActive = button.dataset.mapStyle === (state.mapStyle || 'streets');
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        // Текстовые индикаторы загрузки внутри кнопок
        allButtons.forEach(btn => {
            if (btn && state.isLoading) {
                if (btn.id === 'generateBtn' && state.loadingAction === 'generate') btn.innerHTML = '<i class="ti ti-loader rotate"></i> Генерация...';
                if (btn.id === 'centerGeocodeBtn' && state.loadingAction === 'geocode') btn.innerHTML = '<i class="ti ti-loader rotate"></i> Поиск...';
                if (btn.id === 'addPointBtn' && state.loadingAction === 'add') btn.innerHTML = '<i class="ti ti-loader rotate"></i> Добавление...';
                if (btn.id === 'manualGeocodeBtn' && state.loadingAction === 'geocode') btn.innerHTML = '<i class="ti ti-loader rotate"></i> Поиск...';
                if (btn.id === 'importPointsBtn' && state.loadingAction === 'import') btn.innerHTML = '<i class="ti ti-loader rotate"></i> Импорт...';
                if (btn.id === 'clearPointsBtn' && state.loadingAction === 'clear') btn.innerHTML = '<i class="ti ti-loader rotate"></i> Сброс...';
                if (btn.id === 'buildRouteBtn' && state.loadingAction === 'build') btn.innerHTML = '<i class="ti ti-loader rotate"></i> Построение...';
                if (btn.id === 'optimizeRouteBtn' && state.loadingAction === 'optimize') btn.innerHTML = '<i class="ti ti-loader rotate"></i> Оптимизация...';
            } else if (btn) {
                if (btn.id === 'generateBtn') btn.innerHTML = '<i class="ti ti-map-pin-plus"></i> Сгенерировать';
                if (btn.id === 'centerGeocodeBtn') btn.innerHTML = '<i class="ti ti-search"></i> Найти центр';
                if (btn.id === 'addPointBtn') btn.innerHTML = '<i class="ti ti-map-pin-plus"></i> Добавить точку';
                if (btn.id === 'manualGeocodeBtn') btn.innerHTML = '<i class="ti ti-search"></i> Найти и добавить';
                if (btn.id === 'mapClickAddBtn') btn.innerHTML = '<i class="ti ti-crosshair"></i> Клик по карте';
                if (btn.id === 'importPointsBtn') btn.innerHTML = '<i class="ti ti-upload"></i> Импорт точек';
                if (btn.id === 'clearPointsBtn') btn.innerHTML = '<i class="ti ti-refresh"></i> Новый маршрут';
                if (btn.id === 'buildRouteBtn') btn.innerHTML = '<i class="ti ti-route"></i> Построить маршрут';
                if (btn.id === 'optimizeRouteBtn') btn.innerHTML = '<i class="ti ti-bolt"></i> Оптимизировать';
            }
        });
    });
}
