import { getUserId } from './api/user-id.js';
import { store } from './state/store.js';
import { extractText } from './features/generate-points.js';
import { addPointFromForm, initManualPointValidation } from './features/add-point.js';
import { clearPoints } from './features/clear-points.js';
import { initExportControls } from './features/export-route.js';
import { initGeocodeControls } from './features/geocode.js';
import { initImportControls } from './features/import-points.js';
import { getShareTokenFromUrl, loadSharedRoute } from './features/load-shared-route.js';
import { initMap } from './map/map.js?v=20260530-b2-addresses-v2';
import { initControls } from './ui/controls.js?v=20260530-b2-addresses-v2';
import { initSavingsDashboard } from './ui/metrics.js';
import { notify } from './ui/notifications.js';

async function initApp() {
    const shareToken = getShareTokenFromUrl();
    if (!shareToken) {
        getUserId();
    }
    initMap();
    initControls();
    initExportControls();
    initImportControls();
    initGeocodeControls();
    initManualPointValidation();
    initSavingsDashboard();

    document.getElementById('generateBtn').addEventListener('click', extractText);
    document.getElementById('addPointBtn').addEventListener('click', addPointFromForm);
    document.getElementById('clearPointsBtn').addEventListener('click', clearPoints);

    store.subscribe((state) => {
        if (state.status === 'loading') notify('Загрузка', 'loading');
        if (state.status === 'idle') notify('Готово', 'info');
        if (state.status === 'error') notify('Ошибка API', 'error');
    });

    if (shareToken) {
        await loadSharedRoute(shareToken);
    }
}

document.addEventListener('DOMContentLoaded', initApp);
