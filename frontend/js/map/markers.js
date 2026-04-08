import { store } from "../state/store.js";

export function clearMarkers(mapInstance) {
    store.markers.forEach((marker) => mapInstance.removeLayer(marker));
    store.markers = [];
}

export function renderPoints(mapInstance, points) {
    clearMarkers(mapInstance);
    store.generatedPoints = points;

    points.forEach((point) => {
        const marker = L.marker([point.lat, point.lon]).addTo(mapInstance);
        marker.bindPopup(`<b>Точка ${point.id}</b><br>lat: ${point.lat}<br>lon: ${point.lon}`);
        store.markers.push(marker);
    });
}
