import { getUserId } from './api/user-id.js';
import { store } from './state/store.js';
import { extractText } from './features/generate-points.js';
import { addPointFromForm, initManualPointValidation } from './features/add-point.js';
import { clearPoints } from './features/clear-points.js';
import { initExportControls } from './features/export-route.js';
import { initGeocodeControls } from './features/geocode.js';
import { initImportControls } from './features/import-points.js';
import { getShareTokenFromUrl, loadSharedRoute } from './features/load-shared-route.js';
import { initMap } from './map/map.js?v=20260530-b2-addresses-v3';
import { initControls } from './ui/controls.js?v=20260530-b2-addresses-v3';
import { initSavingsDashboard } from './ui/metrics.js';
import { initBottomSheet } from './ui/bottom-sheet.js';
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
    initBottomSheet();

    document.getElementById('generateBtn').addEventListener('click', extractText);
    document.getElementById('addPointBtn').addEventListener('click', addPointFromForm);
    document.getElementById('clearPointsBtn').addEventListener('click', clearPoints);

    let hadBaseRoute = false;
    store.subscribe((state) => {
        if (state.status === 'loading') notify('Загрузка', 'loading');
        if (state.status === 'idle') notify('Готово', 'info');
        if (state.status === 'error') notify('Ошибка API', 'error');

        // На мобиле приподнимаем шторку, когда появился маршрут
        if (state.baseRoute && !hadBaseRoute) {
            document.dispatchEvent(new CustomEvent('sheet:expand-half'));
        }
        hadBaseRoute = !!state.baseRoute;
    });

    if (shareToken) {
        await loadSharedRoute(shareToken);
    }
}

document.addEventListener('DOMContentLoaded', initApp);
