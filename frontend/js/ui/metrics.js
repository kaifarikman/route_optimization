import { store } from '../state/store.js';
import { compareMetrics } from '../features/compare-metrics.js';

function formatRouteMetrics(route) {
    return `${route.distance_km.toFixed(2)} км | ${route.duration_minutes.toFixed(0)} мин`;
}

export function resetMetrics() {
    const baseEl = document.getElementById('baseMetrics');
    const optEl = document.getElementById('optimizedMetrics');
    const comparisonCard = document.getElementById('comparisonCard');
    const comparisonText = document.getElementById('comparisonText');

    if (baseEl) {
        baseEl.textContent = '0 км | 0 мин';
    }

    if (optEl) {
        optEl.textContent = '0 км | 0 мин';
    }

    if (comparisonCard) {
        comparisonCard.style.display = 'none';
    }

    if (comparisonText) {
        comparisonText.textContent = '';
    }
}

export function updateMetrics(route, mode) {
    const baseEl = document.getElementById('baseMetrics');
    const optEl = document.getElementById('optimizedMetrics');
    const comparisonCard = document.getElementById('comparisonCard');
    const comparisonText = document.getElementById('comparisonText');

    if (route && mode === 'base' && baseEl) {
        baseEl.textContent = formatRouteMetrics(route);
    }

    if (route && mode === 'optimized' && optEl) {
        optEl.textContent = formatRouteMetrics(route);
    }

    const comparison = compareMetrics();
    if (!comparison || !comparisonCard || !comparisonText) {
        if (comparisonCard) {
            comparisonCard.style.display = 'none';
        }
        return;
    }

    comparisonText.textContent = `Расстояние: было ${comparison.distanceBefore.toFixed(2)} км, стало ${comparison.distanceAfter.toFixed(2)} км. Время: было ${comparison.timeBefore.toFixed(0)} мин, стало ${comparison.timeAfter.toFixed(0)} мин. Экономия: ${comparison.distanceSaved.toFixed(2)} км и ${comparison.timeSaved.toFixed(0)} мин.`;
    comparisonCard.style.display = 'block';
}
