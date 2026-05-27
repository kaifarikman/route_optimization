import { store } from '../state/store.js';
import { renderPoints, clearMarkers } from './markers.js';
import { drawRoute, clearRoute } from './routes.js';
import { addPointByCoordinates } from '../features/add-point.js';

const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

let mapInstance = null;
let lastFitRouteKey = null;
let mapLoaded = false;

function routeBounds(route) {
    const routeLine = route?.geometry && route.geometry.length >= 2
        ? route.geometry
        : route?.coordinates;
    if (!routeLine || routeLine.length === 0) return null;

    const bounds = new maplibregl.LngLatBounds();
    routeLine.forEach(([lat, lon]) => bounds.extend([lon, lat]));
    return bounds;
}

function activeRoute(state) {
    const isOptimized = state.selectedRouteMode === 'optimized';
    return {
        route: isOptimized ? state.optimizedRoute : state.baseRoute,
        color: isOptimized ? '#4CAF50' : '#3388ff',
    };
}

function renderMapState(state) {
    if (!mapLoaded) return;

    const { route, color } = activeRoute(state);

    if (state.points && state.points.length > 0) {
        renderPoints(mapInstance, state.points, route, color);
    } else {
        clearMarkers();
    }

    if (route) {
        drawRoute(mapInstance, route, { color });
        const fitKey = `${state.selectedRouteMode}:${route.id || route.points?.join(',')}`;
        const bounds = routeBounds(route);
        if (bounds && fitKey !== lastFitRouteKey) {
            mapInstance.fitBounds(bounds, { padding: 50, maxZoom: 14 });
            lastFitRouteKey = fitKey;
        }
    } else {
        clearRoute(mapInstance);
        lastFitRouteKey = null;
    }
}

export function initMap() {
    if (mapInstance) return mapInstance;
    mapInstance = new maplibregl.Map({
        container: 'map',
        style: MAP_STYLE_URL,
        center: [37.62, 55.75],
        zoom: 10,
        pitch: 30,
        attributionControl: true,
    });

    mapInstance.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-left');

    mapInstance.on('click', async (e) => {
        const state = store.getState();
        if (state.isLoading || state.sharedView) return;

        const { lat, lng } = e.lngLat;
        await addPointByCoordinates(lat, lng, "Точка добавлена кликом");
    });

    mapInstance.on('load', () => {
        mapLoaded = true;
        renderMapState(store.getState());
    });

    store.subscribe(renderMapState);
    return mapInstance;
}
