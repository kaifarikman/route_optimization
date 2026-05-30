import { store } from '../state/store.js';
import { renderPoints, clearMarkers } from './markers.js';
import { drawRoute, clearRoute } from './routes.js';
import { activeVisibleRoute, isRouteVisible, ROUTE_COLORS } from './route-visibility.js';
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

function routeToFit(state) {
    return activeVisibleRoute(state).route;
}

function renderMapState(state) {
    if (!mapLoaded) return;

    const { route, color } = activeVisibleRoute(state);
    mapInstance.getCanvas().style.cursor = state.mapClickAddMode ? "crosshair" : "";

    if (state.points && state.points.length > 0) {
        renderPoints(mapInstance, state.points, route, color);
    } else {
        clearMarkers();
    }

    if (isRouteVisible(state, 'base')) {
        drawRoute(mapInstance, state.baseRoute, { kind: 'base', color: ROUTE_COLORS.base });
    } else {
        clearRoute(mapInstance, 'base');
    }

    if (isRouteVisible(state, 'optimized')) {
        drawRoute(mapInstance, state.optimizedRoute, { kind: 'optimized', color: ROUTE_COLORS.optimized });
    } else {
        clearRoute(mapInstance, 'optimized');
    }

    const fitRoute = routeToFit(state);
    if (fitRoute) {
        const fitMode = fitRoute === state.optimizedRoute ? 'optimized' : 'base';
        const fitKey = `${fitMode}:${fitRoute.id || fitRoute.points?.join(',')}`;
        const bounds = routeBounds(fitRoute);
        if (bounds && fitKey !== lastFitRouteKey) {
            mapInstance.fitBounds(bounds, { padding: 50, maxZoom: 14 });
            lastFitRouteKey = fitKey;
        }
    } else {
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
        if (state.isLoading || state.sharedView || !state.mapClickAddMode) return;

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
