let currentMarkers = [];

export function clearMarkers() {
    currentMarkers.forEach((marker) => marker.remove());
    currentMarkers = [];
}

function markerElement(label, color, ariaLabel) {
    // Внешняя обёртка позиционируется MapLibre (inline transform на каждом кадре).
    // Её transform НЕ должен иметь CSS-transition, иначе маркеры "летают" при панораме.
    const wrapper = document.createElement("div");
    wrapper.className = "route-marker-wrapper";
    // Не даём клику по маркеру дойти до карты (например, в режиме добавления точки кликом)
    wrapper.addEventListener("click", (event) => event.stopPropagation());

    // Внутренний элемент несёт визуальный стиль и hover-анимацию (transform: scale).
    const inner = document.createElement("button");
    inner.type = "button";
    inner.className = "route-marker";
    inner.textContent = label;
    inner.style.setProperty("--marker-color", color);
    inner.setAttribute("aria-label", `Точка маршрута ${ariaLabel}`);
    wrapper.appendChild(inner);

    return wrapper;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function pointPopupHtml(point, orderText) {
    const address = String(point.address || "").trim();
    const coordinates = `<b>Широта:</b> ${point.lat.toFixed(5)}<br><b>Долгота:</b> ${point.lon.toFixed(5)}`;
    if (!address) {
        return `<b>${escapeHtml(orderText)}</b><br>${coordinates}`;
    }
    return `<b>${escapeHtml(orderText)}</b><br><b>Адрес:</b> ${escapeHtml(address)}<br>${coordinates}`;
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
        let markerText = orderText;
        let finalColor = pointColor;

        // Если построен маршрут, выделяем Старт и Финиш согласно ТЗ
        if (hasRouteOrder && orderIndex !== -1) {
            if (orderIndex === 0) {
                finalColor = "#4CAF50"; // Зеленый для Старта
                orderText = "Старт";
                markerText = "S";
            } else if (orderIndex === orderedIds.length - 1) {
                finalColor = "#F44336"; // Красный для Финиша
                orderText = "Финиш";
                markerText = "F";
            }
        }

        const popup = new maplibregl.Popup({ offset: 18 }).setHTML(pointPopupHtml(point, orderText));
        const marker = new maplibregl.Marker({
            element: markerElement(markerText, finalColor, orderText),
            anchor: "center",
        })
            .setLngLat([point.lon, point.lat])
            .setPopup(popup)
            .addTo(mapInstance);

        currentMarkers.push(marker);
    });
}
