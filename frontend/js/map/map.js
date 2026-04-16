import { store } from '../state/store.js';
import { clearMarkers, renderPoints } from './markers.js';
import { drawRoute, clearRoute } from './routes.js';

let mapInstance = null;

export function initMap() {
    if (mapInstance) {
        return mapInstance;
    }

    mapInstance = L.map('map').setView([20.22, 20.22], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
    initMapSubscription(mapInstance);

    return mapInstance;
}

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
        if (state.points && state.points.length > 0) {
            renderPoints(mapInstance, state.points);
        } else {
            clearMarkers(mapInstance);
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

