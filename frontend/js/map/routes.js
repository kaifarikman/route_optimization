let currentRouteLayer = null;

export function clearRoute(mapInstance) {
    if (currentRouteLayer) {
        mapInstance.removeLayer(currentRouteLayer);
        currentRouteLayer = null;
    }
}

export function drawRoute(mapInstance, routeData, options = { color: 'blue' }) {
    //Сначала очищаем старый маршрут
    clearRoute(mapInstance);

    // Проверяем наличие координат из контракта API
    if (routeData && routeData.coordinates && routeData.coordinates.length > 0) {
        currentRouteLayer = L.polyline(routeData.coordinates, {
            color: options.color,
            weight: 6,
            opacity: 0.6,
            lineJoin: 'round'
        }).addTo(mapInstance);

        //Центрируем карту по маршруту
        mapInstance.fitBounds(currentRouteLayer.getBounds(), { padding: [50, 50] });
    }
}