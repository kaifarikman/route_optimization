import { store } from '../state/store.js';
import { renderPoints, clearMarkers } from './markers.js';
import { drawRoute, clearRoute } from './routes.js';
import { addPointByCoordinates } from '../features/add-point.js';

let mapInstance = null;
let lastFitRouteKey = null;

function routeBounds(route) {
    const routeLine = route?.geometry && route.geometry.length >= 2
        ? route.geometry
        : route?.coordinates;
    if (!routeLine || routeLine.length === 0) return null;

    return L.latLngBounds(routeLine.map(([lat, lon]) => [lat, lon]));
}

export function initMap() {
    if (mapInstance) return mapInstance;
    mapInstance = L.map('map').setView([55.75, 37.62], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    mapInstance.on('click', async (e) => {
        const state = store.getState();
        if (state.isLoading || state.sharedView) return;

        const { lat, lng } = e.latlng;
        await addPointByCoordinates(lat, lng, "Точка добавлена кликом");
    });

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
            const fitKey = `${state.selectedRouteMode}:${route.id || route.points?.join(',')}`;
            const bounds = routeBounds(route);
            if (bounds?.isValid() && fitKey !== lastFitRouteKey) {
                mapInstance.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
                lastFitRouteKey = fitKey;
            }
        } else {
            clearRoute(mapInstance);
            lastFitRouteKey = null;
        }
    });
    return mapInstance;
}
