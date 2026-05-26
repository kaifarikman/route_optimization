let currentMarkers = [];

export function clearMarkers(mapInstance) {
    currentMarkers.forEach((marker) => mapInstance.removeLayer(marker));
    currentMarkers = [];
}

export function renderPoints(mapInstance, points, currentRoute = null, pointColor = "#3388ff") {
    clearMarkers(mapInstance);
    let orderedIds = [];
    if (currentRoute) {
        if (currentRoute.point_ids) {
            orderedIds = currentRoute.point_ids;
        } else if (currentRoute.points) {
            orderedIds = currentRoute.points.map(p => p.id || p);
        }
    }

    points.forEach((point) => {
        const orderIndex = orderedIds.indexOf(point.id);
        let orderText = (orderIndex !== -1) ? String(orderIndex + 1) : '';
        let finalColor = pointColor;

        // Если построен маршрут, выделяем Старт и Финиш согласно ТЗ
        if (orderIndex !== -1 && orderedIds.length > 0) {
            if (orderIndex === 0) {
                finalColor = "#4CAF50"; // Зеленый для Старта
                orderText = "Старт";
            } else if (orderIndex === orderedIds.length - 1) {
                finalColor = "#F44336"; // Красный для Финиша
                orderText = "Финиш";
            }
        }

        const marker = L.circleMarker([point.lat, point.lon], {
            radius: 9,
            fillColor: finalColor,
            color: "#000",
            weight: 15,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(mapInstance);
        if (orderText) {
            marker.bindTooltip(orderText, {
                permanent: true,
                direction: 'top',
                className: 'point-order-tooltip',
                offset: [0, -5]
            });
        }

        marker.bindPopup(`<b>Точка ID:</b> ${point.id}<br><b>Широта:</b> ${point.lat.toFixed(5)}<br><b>Долгота:</b> ${point.lon.toFixed(5)}`);

        currentMarkers.push(marker);
    });
}