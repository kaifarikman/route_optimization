import { store } from '../state/store.js';
import { renderPoints } from './markers.js';
import { drawRoute, clearRoute } from './routes.js';

export function initMapSubscription(mapInstance) {
    const fixMapLayout = () => {
        mapInstance.invalidateSize();
    };

    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        const observer = new ResizeObserver(() => fixMapLayout());
        observer.observe(mapContainer);
    }

    store.subscribe((state) => {
        //Отрисовка точек
        if (state.points && state.points.length > 0) {
            renderPoints(mapInstance, state.points);
        }

        const routeToShow = state.selectedRouteMode === 'optimized'
            ? state.optimizedRoute
            : state.baseRoute;

        if (routeToShow) {
            const color = state.selectedRouteMode === 'optimized' ? '#4CAF50' : '#3388ff';
            drawRoute(mapInstance, routeToShow, { color });
        } else {
            clearRoute(mapInstance);
        }
    });
}



