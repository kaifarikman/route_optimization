import { store } from '../state/store.js';
import api from '../api/client.js';
import { compareMetrics } from '../features/compare-metrics.js';
import { estimateSavings } from '../features/savings-estimate.js';
import { enableRouteVisibility } from '../map/route-visibility.js';

const reverseGeocodeCache = new Map();
const reverseGeocodePending = new Set();
let reverseGeocodeQueue = Promise.resolve();

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function pointCoordinateLabel(point) {
    return `${point.lat.toFixed(4)}, ${point.lon.toFixed(4)}`;
}

export function pointAddressLabel(point) {
    return String(point?.address || '').trim();
}

export function pointOrderLabelHtml(point) {
    const address = pointAddressLabel(point);
    let html = `<div class="order-coordinates">${escapeHtml(pointCoordinateLabel(point))}</div>`;
    if (address) {
        html += `<div class="order-address">${escapeHtml(address)}</div>`;
    }
    return html;
}

function formatRouteMetrics(route) {
    const distance = `Длина: ${route.distance_km.toFixed(1)} км`;
    const duration = `Время: ${route.duration_minutes.toFixed(0)} мин`;
    const provider = `Источник: ${route.provider}${route.is_fallback ? ' (запасной)' : ''}`;
    const geometryLabels = {
        'full': 'по дорогам',
        'straight': 'прямые линии'
    };
    const geometryText = geometryLabels[route.geometry_type] || route.geometry_type;
    const geometry = `Геометрия: ${geometryText}`;

    let html = `
        <div class="metric-row">${distance}</div>
        <div class="metric-row">${duration}</div>
        <div class="metric-row">${provider}</div>
        <div class="metric-row">${geometry}</div>
    `;
    if (route.is_fallback) {
        html += `
            <div class="fallback-warning">
                Внимание: дорожный API недоступен, использован приближенный расчет.
            </div>
        `;
    }

    return html;
}

export function resetMetrics() {
    document.getElementById('baseMetrics').innerHTML = '';
    document.getElementById('optimizedMetrics').innerHTML = '';
    hideSavingsDashboard();

    const orderCard = document.getElementById('routeOrderCard');
    if (orderCard) orderCard.style.display = 'none';
    document.getElementById('routeOrderList').innerHTML = '';
}

export function updateMetrics(route, mode) {
    if (mode === 'base') {
        document.getElementById('baseMetrics').innerHTML = formatRouteMetrics(route);
        updateSavingsDashboard();
    } else if (mode === 'optimized') {
        let html = formatRouteMetrics(route);

        // Считаем экономию через вызов готовой фичи
        const comparison = compareMetrics();
        if (comparison && comparison.distancePercent > 0) {
            html += `
                <div class="improvement-badge">
                    <i class="ti ti-trending-down"></i> Эффективнее на ${comparison.distancePercent.toFixed(1)}% (−${comparison.timeSaved.toFixed(0)} мин)
                </div>
            `;
        }
        document.getElementById('optimizedMetrics').innerHTML = html;
        updateSavingsDashboard();
    }

    // Рендерим порядок посещения
    renderRouteOrderList(route);
}

export function updateRouteOrder(route) {
    renderRouteOrderList(route);
}

export function initSavingsDashboard() {
    ['rubPerKmInput', 'rubPerMinuteInput'].forEach(id => {
        const input = document.getElementById(id);
        if (!input || input.dataset.bound) return;

        input.addEventListener('input', updateSavingsDashboard);
        input.dataset.bound = 'true';
    });
}

function hideSavingsDashboard() {
    const dashboard = document.getElementById('savingsDashboard');
    if (dashboard) dashboard.hidden = true;
}

function readSavingsCoefficients() {
    return {
        rubPerKm: document.getElementById('rubPerKmInput')?.value,
        rubPerMinute: document.getElementById('rubPerMinuteInput')?.value,
    };
}

function formatDistance(value) {
    return `${value.toFixed(1).replace('.', ',')} км`;
}

function formatMinutes(value) {
    return `${Math.round(value)} мин`;
}

function formatRubles(value) {
    return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
}

function formatCoefficient(value) {
    return value.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function pointLocationKey(point) {
    return `${Number(point.lat).toFixed(6)},${Number(point.lon).toFixed(6)}`;
}

async function reverseGeocodeWithRetry(point, attempts = 3) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
            return await api.reverseGeocode(point.lat, point.lon);
        } catch (error) {
            if (!String(error.message || '').includes('rate limit') || attempt === attempts - 1) {
                throw error;
            }
            await sleep(1200);
        }
    }
    return null;
}

function activeRouteForOrder(state) {
    return state.optimizedRoute || state.baseRoute;
}

async function resolvePointAddress(point) {
    const key = pointLocationKey(point);
    try {
        const cachedAddress = reverseGeocodeCache.get(key);
        if (!cachedAddress) {
            await sleep(1100);
        }
        const address = cachedAddress || String((await reverseGeocodeWithRetry(point))?.result?.display_name || '').trim();
        if (!address) return;

        reverseGeocodeCache.set(key, address);
        const state = store.getState();
        const points = state.points.map(currentPoint => {
            if (currentPoint.id !== point.id || pointLocationKey(currentPoint) !== key || pointAddressLabel(currentPoint)) {
                return currentPoint;
            }
            return {
                ...currentPoint,
                address,
                geocoding_provider: currentPoint.geocoding_provider || 'nominatim',
            };
        });
        store.setState({ points });
        renderRouteOrderList(activeRouteForOrder(store.getState()));
    } catch (error) {
        console.warn('Reverse geocoding failed:', error);
    } finally {
        reverseGeocodePending.delete(key);
    }
}

function scheduleReverseGeocoding(orderedIds, state) {
    const pointsMap = new Map(state.points.map(point => [point.id, point]));

    orderedIds.forEach(id => {
        const point = pointsMap.get(id);
        if (!point || pointAddressLabel(point)) return;

        const key = pointLocationKey(point);
        if (reverseGeocodeCache.has(key)) return;
        if (reverseGeocodePending.has(key)) return;

        reverseGeocodePending.add(key);
        reverseGeocodeQueue = reverseGeocodeQueue.then(() => resolvePointAddress({ ...point }));
    });
}

function updateSavingsDashboard() {
    const dashboard = document.getElementById('savingsDashboard');
    if (!dashboard) return;

    const estimate = estimateSavings(compareMetrics(), readSavingsCoefficients());
    if (!estimate) {
        dashboard.hidden = true;
        return;
    }

    document.getElementById('savingsDistance').textContent = formatDistance(estimate.distanceSavedKm);
    document.getElementById('savingsTime').textContent = formatMinutes(estimate.timeSavedMinutes);
    document.getElementById('savingsRubles').textContent = formatRubles(estimate.rubles);
    document.getElementById('savingsFormula').textContent =
        `Расчет: ${formatDistance(estimate.distanceSavedKm)} × ${formatCoefficient(estimate.rubPerKm)} ₽/км + ` +
        `${formatMinutes(estimate.timeSavedMinutes)} × ${formatCoefficient(estimate.rubPerMinute)} ₽/мин`;

    dashboard.hidden = false;
}

function getOrderedIds(route) {
    if (route?.point_ids) {
        return route.point_ids;
    }
    if (route?.points) {
        return route.points.map(point => point.id || point);
    }
    return [];
}

function renderRouteOrderList(route) {
    const orderCard = document.getElementById('routeOrderCard');
    const orderList = document.getElementById('routeOrderList');
    if (!orderCard || !orderList) return;

    if (!route) {
        orderCard.style.display = 'none';
        orderList.innerHTML = '';
        return;
    }

    const orderedIds = getOrderedIds(route);

    if (orderedIds.length === 0) {
        orderCard.style.display = 'none';
        return;
    }

    orderCard.style.display = 'flex';
    orderList.innerHTML = '';

    const state = store.getState();
    const pointsMap = new Map(state.points.map(p => [p.id, p]));
    scheduleReverseGeocoding(orderedIds, state);

    orderedIds.forEach((id, index) => {
        const pointObj = pointsMap.get(id);
        if (!pointObj) return;

        const item = document.createElement('div');
        item.className = 'order-item';
        item.setAttribute('draggable', 'true');
        item.setAttribute('data-id', id);

        let routePosition = `Точка ${index + 1}`;
        if (index === 0) routePosition = 'Старт';
        else if (index === orderedIds.length - 1) routePosition = 'Финиш';

        item.innerHTML = `
            <div class="order-num">${index + 1}</div>
            <div class="order-coord">${pointOrderLabelHtml(pointObj)}</div>
            <div class="order-dist">${routePosition}</div>
        `;

        // Реализация HTML5 Drag and Drop API
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', index);
            item.style.opacity = '0.4';
        });

        item.addEventListener('dragend', () => {
            item.style.opacity = '1';
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        item.addEventListener('drop', async (e) => {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
            const toIndex = index;

            if (fromIndex === toIndex) return;

            const newOrderedIds = [...orderedIds];
            const [movedId] = newOrderedIds.splice(fromIndex, 1);
            newOrderedIds.splice(toIndex, 0, movedId);

            // Обновляем базовый маршрут через ручной Drag&Drop пересчет
            store.setState({ status: 'loading', isLoading: true, loadingAction: 'build' });
            try {
                const api = (await import('../api/client.js')).default;
                const result = await api.buildBaseRoute(newOrderedIds);
                store.setState({
                    baseRoute: result.route,
                    routeVisibility: enableRouteVisibility(store.getState().routeVisibility, 'base'),
                    selectedRouteMode: 'base',
                    status: 'idle',
                    isLoading: false,
                    loadingAction: null
                });
                updateMetrics(result.route, 'base');
            } catch (err) {
                store.setState({ status: 'error', isLoading: false, loadingAction: null });
            }
        });

        orderList.appendChild(item);
    });
}
