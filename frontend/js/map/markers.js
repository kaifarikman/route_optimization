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
    const hasRouteOrder = orderedIds.length > 0;

    points.forEach((point, index) => {
        const orderIndex = orderedIds.indexOf(point.id);
        let orderText = hasRouteOrder && orderIndex !== -1 ? String(orderIndex + 1) : String(index + 1);
        let finalColor = pointColor;

        // Если построен маршрут, выделяем Старт и Финиш согласно ТЗ
        if (hasRouteOrder && orderIndex !== -1) {
            if (orderIndex === 0) {
                finalColor = "#4CAF50"; // Зеленый для Старта
                orderText = "Старт";
            } else if (orderIndex === orderedIds.length - 1) {
                finalColor = "#F44336"; // Красный для Финиша
                orderText = "Финиш";
            }
        }

        const marker = L.circleMarker([point.lat, point.lon], {
            radius: 7,
            fillColor: finalColor,
            color: "#111827",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.88
        }).addTo(mapInstance);
        if (orderText) {
            marker.bindTooltip(orderText, {
                permanent: true,
                direction: 'top',
                className: 'point-order-tooltip',
                offset: [0, -5]
            });
        }

        marker.bindPopup(`<b>${orderText}</b><br><b>Широта:</b> ${point.lat.toFixed(5)}<br><b>Долгота:</b> ${point.lon.toFixed(5)}`);

        currentMarkers.push(marker);
    });
}
