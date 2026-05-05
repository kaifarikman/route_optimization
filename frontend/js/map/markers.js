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

    let orderedIds = points.map(p => p.id);
    if (currentRoute) {
        if (currentRoute.point_ids) {
            orderedIds = currentRoute.point_ids;
        } else if (currentRoute.points) {
            orderedIds = currentRoute.points.map(p => p.id || p);
        }
    }

    points.forEach((point) => {
        const orderIndex = orderedIds.indexOf(point.id);
        const orderText = (currentRoute && orderIndex !== -1) ? String(orderIndex + 1) : '';

        const marker = L.circleMarker([point.lat, point.lon], {
            radius: 8,
            fillColor: pointColor,
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(mapInstance);
        if (orderText) {
            marker.bindTooltip(orderText, {
                permanent: true,
                direction: 'top',
                className: 'point-order-tooltip',
                offset: [0, -5]
            });
        }

        if (orderText) {
            marker.bindTooltip(orderText, {
                permanent: true,
                className: 'point-order-tooltip'
            });
        }

        const popupContent = `<b>Точка ${point.id}</b>` +
            (orderText ? `Порядок посещения: ${orderText}` : '');

        marker.bindPopup(popupContent);
        currentMarkers.push(marker);
    });

    if (currentMarkers.length > 0) {
        const featureGroup = L.featureGroup(currentMarkers);
        mapInstance.fitBounds(featureGroup.getBounds(), { padding: [50, 50] });
    }
}


