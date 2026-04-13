let currentMarkers = [];

export function clearMarkers(mapInstance) {
    currentMarkers.forEach((marker) => mapInstance.removeLayer(marker));
    currentMarkers = [];
}

export function renderPoints(mapInstance, points) {
    clearMarkers(mapInstance);

    points.forEach((point) => {
        const marker = L.marker([point.lat, point.lon]).addTo(mapInstance);
        marker.bindPopup(`<b>Точка ${point.id}</b>`);
        currentMarkers.push(marker);
    });
}