import { store } from '../state/store.js';
import { compareMetrics } from '../features/compare-metrics.js';

export function updateMetrics() {
    const { baseRoute, optimizedRoute } = store.getState();

    const baseEl = document.getElementById('baseMetrics');
    const optEl = document.getElementById('optimizedMetrics');
    const savingEl = document.querySelector('.improvement');

    //Обновляем метрики базового маршрута
    if (baseRoute && baseEl) {
        baseEl.textContent = `${baseRoute.distance_km.toFixed(2)} км | ${baseRoute.duration_minutes.toFixed(0)} мин`;
    }

    //Обновляем метрики оптимизированного маршрута
    if (optimizedRoute && optEl) {
        optEl.textContent = `${optimizedRoute.distance_km.toFixed(2)} км | ${optimizedRoute.duration_minutes.toFixed(0)} мин`;
    }

    if (baseRoute && optimizedRoute && savingEl) {
        const result = compareMetrics(baseRoute, optimizedRoute);
        if (result) {
            savingEl.textContent = result;
            savingEl.style.display = 'flex';
        } else {
            savingEl.style.display = 'none';
        }
    } else if (savingEl) {
        savingEl.style.display = 'none';
    }
}


