import api from './api/client.js';
import { store } from './state/store.js';
import { extractText } from './features/generate-points.js';
import { buildRoute } from './features/build-route.js';
import { optimizeRoute } from './features/optimize-route.js';
import { initMapSubscription } from './map/map.js';

let map;
// Реализация инициализации согласно ТЗ
async function initApp() {
    //Инициализируем карту
    initMap();
    //Загружаем текущие точки из backend
    try {
        store.setState({ status: 'loading' });
        const result = await api.getPoints();
        //Сохраняем в store
        store.setState({
            points: result.points || [],
            status: 'idle'
        });
    } catch (error) {
        console.error("Ошибка при загрузке точек:", error);
        store.setState({ status: 'error' });
    }
}

function initMap() {
    map = L.map('map').setView([20.22, 20.22], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    initMapSubscription(map);
}

document.getElementById('generateBtn')?.addEventListener('click', extractText);
document.getElementById('buildRouteBtn')?.addEventListener('click', buildRoute);
document.getElementById('optimizeRouteBtn')?.addEventListener('click', optimizeRoute);

store.subscribe((state) => {
    const indicator = document.getElementById('status-indicator');
    if (indicator) {
        indicator.textContent = state.status === 'loading' ? 'Обработка...' : 'Готово';
    }
});
initApp();


