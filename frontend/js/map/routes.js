let currentRouteLayer = null;

export function clearRoute(mapInstance) {
    if (currentRouteLayer) {
        mapInstance.removeLayer(currentRouteLayer);
        currentRouteLayer = null;
    }
}

export function drawRoute(mapInstance, routeData, options = { color: 'blue' }) {
    //очищаем старый маршрут
    clearRoute(mapInstance);

    if (!routeData) return;
    const routeLine = routeData.geometry && routeData.geometry.length >= 2
        ? routeData.geometry
        : routeData.coordinates;
    if (routeLine && routeLine.length > 0) {
        currentRouteLayer = L.polyline(routeLine, {
            color: options.color,
            weight: 6,
            opacity: 0.6,
            lineJoin: 'round'
        }).addTo(mapInstance);

        mapInstance.fitBounds(currentRouteLayer.getBounds(), { padding: [50, 50] });
    } else {
        console.warn("Внимание: маршрут не содержит валидных geometry или coordinates для отрисовки.");
    }
}