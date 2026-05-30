import { store } from '../state/store.js';
import { compareMetrics } from '../features/compare-metrics.js';
import { estimateSavings } from '../features/savings-estimate.js';
import { enableRouteVisibility } from '../map/route-visibility.js';

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
            <div class="order-coord">${pointObj.lat.toFixed(4)}, ${pointObj.lon.toFixed(4)}</div>
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
