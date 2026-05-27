const ROUTE_SOURCE_ID = "active-route";
const ROUTE_LAYER_ID = "active-route-line";

let currentRouteData = null;
let currentRouteOptions = { color: "blue" };

function routeLine(routeData) {
    return routeData?.geometry && routeData.geometry.length >= 2
        ? routeData.geometry
        : routeData?.coordinates;
}

function routeFeature(routeData) {
    const line = routeLine(routeData);
    if (!line || line.length === 0) return null;

    return {
        type: "Feature",
        properties: {},
        geometry: {
            type: "LineString",
            coordinates: line.map(([lat, lon]) => [lon, lat]),
        },
    };
}

function removeRouteLayer(mapInstance) {
    if (mapInstance.getLayer(ROUTE_LAYER_ID)) {
        mapInstance.removeLayer(ROUTE_LAYER_ID);
    }
    if (mapInstance.getSource(ROUTE_SOURCE_ID)) {
        mapInstance.removeSource(ROUTE_SOURCE_ID);
    }
}

export function clearRoute(mapInstance) {
    currentRouteData = null;
    currentRouteOptions = { color: "blue" };
    if (!mapInstance?.getStyle()) return;
    removeRouteLayer(mapInstance);
}

export function drawRoute(mapInstance, routeData, options = { color: 'blue' }) {
    if (!routeData) return;
    currentRouteData = routeData;
    currentRouteOptions = options;

    const feature = routeFeature(routeData);
    if (!feature) {
        console.warn("Внимание: маршрут не содержит валидных данных (geometry/coordinates) для отрисовки.");
        return;
    }

    if (!mapInstance.isStyleLoaded()) {
        mapInstance.once("idle", () => drawRoute(mapInstance, currentRouteData, currentRouteOptions));
        return;
    }

    const isStraight = routeData.geometry_type === "straight" || routeData.is_fallback;
    const source = mapInstance.getSource(ROUTE_SOURCE_ID);

    if (source) {
        source.setData(feature);
    } else {
        mapInstance.addSource(ROUTE_SOURCE_ID, {
            type: "geojson",
            data: feature,
        });
    }

    if (!mapInstance.getLayer(ROUTE_LAYER_ID)) {
        mapInstance.addLayer({
            id: ROUTE_LAYER_ID,
            type: "line",
            source: ROUTE_SOURCE_ID,
            layout: {
                "line-cap": "round",
                "line-join": "round",
            },
            paint: {
                "line-color": options.color,
                "line-width": 6,
                "line-opacity": 0.68,
                "line-dasharray": isStraight ? [1.4, 1.4] : [1, 0],
            },
        });
    } else {
        mapInstance.setPaintProperty(ROUTE_LAYER_ID, "line-color", options.color);
        mapInstance.setPaintProperty(ROUTE_LAYER_ID, "line-dasharray", isStraight ? [1.4, 1.4] : [1, 0]);
    }
}
