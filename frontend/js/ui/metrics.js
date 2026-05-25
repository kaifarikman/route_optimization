import { store } from '../state/store.js';
import { compareMetrics } from '../features/compare-metrics.js';
import { buildRoute } from '../features/build-route.js';

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

export function updateMetrics(route, type) {
    const formattedHtml = formatRouteMetrics(route);

    if (type === 'base') {
        const baseEl = document.getElementById('baseMetrics');
        if (baseEl) baseEl.innerHTML = formattedHtml;
    } else if (type === 'optimized') {
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

    list.innerHTML = '';

    orderedIds.forEach((id, index) => {
        const pointObj = points.find(p => p.id === id);
        if (!pointObj) return;

        const li = document.createElement('li');
        li.style.padding = '8px';
        li.style.margin = '4px 0';
        li.style.background = '#fff';
        li.style.border = '1px solid #ccc';
        li.style.borderRadius = '4px';
        li.style.cursor = 'grab';
        li.setAttribute('draggable', 'true');
        li.setAttribute('data-id', id);
        li.innerHTML = `<b>${index + 1}.</b> Точка ${id} (${pointObj.lat.toFixed(4)}, ${pointObj.lon.toFixed(4)})`;

        // Реализация HTML5 Drag and Drop API
        li.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', index);
            li.style.opacity = '0.5';
        });

        li.addEventListener('dragend', () => {
            li.style.opacity = '1';
        });

        li.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        li.addEventListener('drop', async (e) => {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
            const toIndex = index;

            if (fromIndex === toIndex) return;

            const newOrderedIds = [...orderedIds];
            const [movedId] = newOrderedIds.splice(fromIndex, 1);
            newOrderedIds.splice(toIndex, 0, movedId);

            const reorderedPoints = newOrderedIds.map(pid => points.find(p => p.id === pid));
            store.setState({ points: reorderedPoints });

            await buildRoute();
        });

        list.appendChild(li);
    });

    card.style.display = 'block';
}