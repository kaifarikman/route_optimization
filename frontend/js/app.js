import api from './api/client.js';
import { store } from './state/store.js';
import { extractText } from './features/generate-points.js';
import { buildRoute } from './features/build-route.js';
import { optimizeRoute } from './features/optimize-route.js';
import { initMapSubscription } from './map/map.js';
import { initControls } from './ui/controls.js';
import { notify } from './ui/notifications.js';

async function initApp() {
    //Инициализация карты
    const map = L.map('map').setView([20.22, 20.22], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    initMapSubscription(map);

    //Инициализация кликов по карточкам
    initControls();

    //Подписка уведомлений на изменение статуса в Store
    store.subscribe((state) => {
        if (state.status === 'loading') notify('Загрузка', 'loading');
        if (state.status === 'idle') notify('Готово', 'info');
        if (state.status === 'error') notify('Ошибка API', 'error');
    });

    //Загрузка начальных данных
    try {
        store.setState({ status: 'loading' });
        const result = await api.getPoints();
        store.setState({ points: result.points || [], status: 'idle' });
    } catch (e) {
        store.setState({ status: 'error' });
    }
}

document.getElementById('generateBtn')?.addEventListener('click', extractText);
document.getElementById('buildRouteBtn')?.addEventListener('click', buildRoute);
document.getElementById('optimizeRouteBtn')?.addEventListener('click', optimizeRoute);

window.onload = initApp;


