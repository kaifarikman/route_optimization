import { store } from '../state/store.js';
import { renderPoints } from './markers.js';
import { renderRoute } from './routes.js';

// Исправляем иконки (чтобы не было 404 ошибок)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export function initMapSubscription(mapInstance) {
    // Функция для принудительной перерисовки
    const fixMapLayout = () => {
        mapInstance.invalidateSize();
    };

    // Следим за размером контейнера (решает проблему "кусков" в Docker/Nginx)
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        const observer = new ResizeObserver(() => fixMapLayout());
        observer.observe(mapContainer);
    }

    // Запасной вариант для медленных соединений
    setTimeout(fixMapLayout, 500);

    store.subscribe((state) => {
        // Отрисовка точек
        if (state.points && state.points.length > 0) {
            renderPoints(mapInstance, state.points);
        }

        // Отрисовка маршрута
        const isOptimized = state.selectedRouteMode === 'optimized';
        const routeData = isOptimized ? state.optimizedRoute : state.baseRoute;

        if (routeData) {
            renderRoute(mapInstance, routeData, {
                color: isOptimized ? 'green' : 'blue'
            });
        }
    });
}



