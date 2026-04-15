let currentMarkers = [];

export function clearMarkers(mapInstance) {
    currentMarkers.forEach((marker) => mapInstance.removeLayer(marker));
    currentMarkers = [];
}

export function renderPoints(mapInstance, points) {
    clearMarkers(mapInstance);

    points.forEach((point) => {
        const marker = L.circleMarker([point.lat, point.lon], {
            radius: 8,
            fillColor: "#3388ff",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(mapInstance);

        marker.bindPopup(`<b>Точка ${point.id}</b>`);
        currentMarkers.push(marker);
    });
}