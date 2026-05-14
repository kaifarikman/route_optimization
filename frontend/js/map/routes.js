let currentRouteLayer = null;

export function clearRoute(mapInstance) {
    if (currentRouteLayer) {
        mapInstance.removeLayer(currentRouteLayer);
        currentRouteLayer = null;
    }
}

export function drawRoute(mapInstance, routeData, options = { color: 'blue' }) {
    clearRoute(mapInstance);

    if (!routeData) return;
    const routeLine = routeData.geometry && routeData.geometry.length >= 2
        ? routeData.geometry
        : routeData.coordinates;
    if (routeLine && routeLine.length > 0) {
        const isStraight = routeData.geometry_type === 'straight' || routeData.is_fallback;

        const polylineOptions = {
            color: options.color,
            weight: 6,
            opacity: 0.6,
            lineJoin: 'round',
            dashArray: isStraight ? '8, 8' : null
        };

        currentRouteLayer = L.polyline(routeLine, polylineOptions).addTo(mapInstance);
        mapInstance.fitBounds(currentRouteLayer.getBounds(), { padding: [50, 50] });
    } else {
        console.warn("Внимание: маршрут не содержит валидных данных (geometry/coordinates) для отрисовки.");
    }
}