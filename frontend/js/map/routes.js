let currentRouteLayer = null;

export function renderRoute(mapInstance, routeData, options = { color: 'blue' }) {
    //Удаляем предыдущий маршрут с карты
    if (currentRouteLayer) {
        mapInstance.removeLayer(currentRouteLayer);
    }

    //Проверяем наличие координат из контракта API
    if (routeData && routeData.coordinates && routeData.coordinates.length > 0) {
        currentRouteLayer = L.polyline(routeData.coordinates, {
            color: options.color,
            weight: 6,
            opacity: 0.6,
            lineJoin: 'round'
        }).addTo(mapInstance);

        mapInstance.fitBounds(currentRouteLayer.getBounds(), { padding: [50, 50] });
    }
}