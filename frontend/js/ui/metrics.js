import { store } from '../state/store.js';
import { compareMetrics } from '../features/compare-metrics.js';

function formatRouteMetrics(route) {
    return `${route.distance_km.toFixed(2)} км | ${route.duration_minutes.toFixed(0)} мин`;
}

export function resetMetrics() {
    document.getElementById('baseMetrics').textContent = '0 км | 0 мин';
    document.getElementById('optimizedMetrics').textContent = '0 км | 0 мин';
    document.getElementById('comparisonCard').style.display = 'none';
    document.getElementById('routeOrderCard').style.display = 'none';
    document.getElementById('routeOrderList').innerHTML = '';
}

export function updateMetrics(route, mode) {
    const baseEl = document.getElementById('baseMetrics');
    const optEl = document.getElementById('optimizedMetrics');

    if (route && mode === 'base') baseEl.textContent = formatRouteMetrics(route);
    if (route && mode === 'optimized') optEl.textContent = formatRouteMetrics(route);
    renderOrderList(route);

    const comparison = compareMetrics();
    if (comparison) {
        const compText = document.getElementById('comparisonText');
        compText.textContent = `Экономия: ${comparison.distanceSaved.toFixed(2)} км и ${comparison.timeSaved.toFixed(0)} мин.`;
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
        return p ? `<li><b>${index + 1}.</b> Точка ${p.id} — ${p.lat.toFixed(3)}, ${p.lon.toFixed(3)}</li>` : '';
    }).join('');

    card.style.display = 'block';
}


