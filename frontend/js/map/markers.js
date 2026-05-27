let currentMarkers = [];

export function clearMarkers() {
    currentMarkers.forEach((marker) => marker.remove());
    currentMarkers = [];
}

function markerElement(label, color) {
    const element = document.createElement("button");
    element.type = "button";
    element.className = "route-marker";
    element.textContent = label;
    element.style.setProperty("--marker-color", color);
    element.setAttribute("aria-label", `Точка маршрута ${label}`);
    element.addEventListener("click", (event) => event.stopPropagation());
    return element;
}

export function renderPoints(mapInstance, points, currentRoute = null, pointColor = "#3388ff") {
    clearMarkers();
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

        const popup = new maplibregl.Popup({ offset: 18 }).setHTML(
            `<b>${orderText}</b><br><b>Широта:</b> ${point.lat.toFixed(5)}<br><b>Долгота:</b> ${point.lon.toFixed(5)}`
        );
        const marker = new maplibregl.Marker({
            element: markerElement(orderText, finalColor),
            anchor: "center",
        })
            .setLngLat([point.lon, point.lat])
            .setPopup(popup)
            .addTo(mapInstance);

        currentMarkers.push(marker);
    });
}
