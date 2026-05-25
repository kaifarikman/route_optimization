import { store } from '../state/store.js';
import { renderPoints, clearMarkers } from './markers.js';
import { drawRoute, clearRoute } from './routes.js';

let mapInstance = null;

export function initMap() {
    if (mapInstance) return mapInstance;
    mapInstance = L.map('map').setView([55.75, 37.62], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    store.subscribe((state) => {
        const isOptimized = state.selectedRouteMode === 'optimized';
        const route = isOptimized ? state.optimizedRoute : state.baseRoute;
        const color = isOptimized ? '#4CAF50' : '#3388ff';

        if (state.points && state.points.length > 0) {
            renderPoints(mapInstance, state.points, route, color);
        } else {
            clearMarkers(mapInstance);
        }

        if (route) {
            drawRoute(mapInstance, route, { color });
        } else {
            clearRoute(mapInstance);
        }
    });
    return mapInstance;
}