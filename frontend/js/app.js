import api from './api/client.js';
import { store } from './state/store.js';
import { extractText } from './features/generate-points.js';
import { addPointFromForm } from './features/add-point.js';
import { clearPoints } from './features/clear-points.js';
import { initMap } from './map/map.js';
import { initControls } from './ui/controls.js';
import { notify } from './ui/notifications.js';

async function initApp() {
    initMap();
    initControls();

    document.getElementById('generateBtn').addEventListener('click', extractText);
    document.getElementById('addPointBtn').addEventListener('click', addPointFromForm);
    document.getElementById('clearPointsBtn').addEventListener('click', clearPoints);

    store.subscribe((state) => {
        if (state.status === 'loading') notify('Загрузка', 'loading');
        if (state.status === 'idle') notify('Готово', 'info');
        if (state.status === 'error') notify('Ошибка API', 'error');
    });

    try {
        store.setState({ status: 'loading', loadingAction: 'init' });
        const result = await api.getPoints();
        store.setState({ points: result.points || [], status: 'idle', loadingAction: null });
    } catch (e) {
        store.setState({ status: 'error', loadingAction: null });
    }
}

document.addEventListener('DOMContentLoaded', initApp);
