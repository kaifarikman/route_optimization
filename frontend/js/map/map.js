import { store } from '../state/store.js';
import { renderPoints, clearMarkers } from './markers.js';
import { drawRoute, clearRoute } from './routes.js';

let mapInstance = null;

export function initMap() {
    if (mapInstance) return mapInstance;

    mapInstance = L.map('map').setView([20.22, 20.22], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);

    store.subscribe((state) => {
        const isOptimizedMode = state.selectedRouteMode === 'optimized';
        const routeToShow = isOptimizedMode ? state.optimizedRoute : state.baseRoute;

        const color = isOptimizedMode ? '#4CAF50' : '#3388ff';

        if (state.points && state.points.length > 0) {
            renderPoints(mapInstance, state.points, routeToShow, color);
        } else {
            clearMarkers(mapInstance);
        }

        if (routeToShow) {
            drawRoute(mapInstance, routeToShow, { color });
        } else {
            clearRoute(mapInstance);
        }
    });
    return mapInstance;
}


