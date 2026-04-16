import api from './api/client.js';
import { store } from './state/store.js';
import { extractText } from './features/generate-points.js';
import { clearPoints } from './features/clear-points.js';
import { initMap } from './map/map.js';
import { initControls } from './ui/controls.js';
import { notify } from './ui/notifications.js';

async function initApp() {
    initMap();
    initControls();

    document.getElementById('generateBtn').addEventListener('click', extractText);
    document.getElementById('clearPointsBtn').addEventListener('click', clearPoints);

    store.subscribe((state) => {
        if (state.status === 'loading') notify('Загрузка', 'loading');
        if (state.status === 'idle') notify('Готово', 'info');
        if (state.status === 'error') notify('Ошибка API', 'error');
    });

    try {
        store.setState({ status: 'loading' });
        const result = await api.getPoints();
        store.setState({ points: result.points || [], status: 'idle' });
    } catch (e) {
        store.setState({ status: 'error' });
    }
}

document.addEventListener('DOMContentLoaded', initApp);
