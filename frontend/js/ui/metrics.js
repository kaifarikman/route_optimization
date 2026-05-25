import { store } from '../state/store.js';
import { compareMetrics } from '../features/compare-metrics.js';

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
    document.getElementById('baseMetrics').innerHTML = '0 км | 0 мин';
    document.getElementById('optimizedMetrics').innerHTML = '0 км | 0 мин';
    document.getElementById('comparisonCard').style.display = 'none';
    document.getElementById('routeOrderCard').style.display = 'none';
}

export function updateMetrics(route, mode) {
    if (!route) return;

    const formattedHtml = formatRouteMetrics(route);
    if (mode === 'base') {
        const baseEl = document.getElementById('baseMetrics');
        if (baseEl) baseEl.innerHTML = formattedHtml;
    } else if (mode === 'optimized') {
        const optEl = document.getElementById('optimizedMetrics');
        if (optEl) optEl.innerHTML = formattedHtml;
    }

    renderOrderList(route);

    const comparison = compareMetrics();
    if (comparison) {
        const compText = document.getElementById('comparisonText');

        if (comparison.distanceSaved > 0) {
            compText.innerHTML = `Экономия: ${comparison.distanceSaved.toFixed(2)} км и ${comparison.timeSaved.toFixed(0)} мин.<br>Улучшение: ${comparison.distancePercent.toFixed(1)}%`;
        } else if (comparison.distanceSaved < 0) {
            compText.innerHTML = `Оптимизированный маршрут оказался длиннее на ${Math.abs(comparison.distanceSaved).toFixed(2)} км`;
        } else {
            compText.innerHTML = `Длина маршрутов совпадает`;
        }

        document.getElementById('comparisonCard').style.display = 'block';
    }
}

function renderOrderList(route) {
    const card = document.getElementById('routeOrderCard');
    const list = document.getElementById('routeOrderList');
    const { points } = store.getState();

    if (!route || !points.length) {
        card.style.display = 'none';
        return;
    }
    const orderedIds = route.point_ids || route.points?.map(p => p.id || p) || [];

    list.innerHTML = orderedIds.map((id, index) => {
        const p = points.find(point => point.id === id);
        return `<li>${index + 1}. Точка ${id} ${p ? `(${p.lat.toFixed(4)}, ${p.lon.toFixed(4)})` : ''}</li>`;
    }).join('');

    card.style.display = 'block';
}