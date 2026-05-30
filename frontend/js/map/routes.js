const ROUTES = {
    base: {
        sourceId: "base-route",
        layerId: "base-route-line",
        color: "#3388ff",
        lineOffset: -3,
    },
    optimized: {
        sourceId: "optimized-route",
        layerId: "optimized-route-line",
        color: "#4CAF50",
        lineOffset: 3,
    },
};

let currentRoutes = {
    base: null,
    optimized: null,
};
let currentRouteOptions = {
    base: {},
    optimized: {},
};

function routeConfig(kind = "base") {
    return ROUTES[kind] || ROUTES.base;
}

function routeKind(kind = "base") {
    return ROUTES[kind] ? kind : "base";
}

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

function removeRouteLayer(mapInstance, kind) {
    const config = routeConfig(kind);
    if (mapInstance.getLayer(config.layerId)) {
        mapInstance.removeLayer(config.layerId);
    }
    if (mapInstance.getSource(config.sourceId)) {
        mapInstance.removeSource(config.sourceId);
    }
}

export function clearRoute(mapInstance, kind = null) {
    const kinds = kind ? [routeKind(kind)] : Object.keys(ROUTES);
    kinds.forEach(routeKind => {
        currentRoutes[routeKind] = null;
        currentRouteOptions[routeKind] = {};
    });
    if (!mapInstance?.getStyle()) return;
    kinds.forEach(routeKind => removeRouteLayer(mapInstance, routeKind));
}

export function drawRoute(mapInstance, routeData, options = { color: 'blue' }) {
    if (!routeData) return;
    const kind = routeKind(options.kind);
    const config = routeConfig(kind);
    currentRoutes[kind] = routeData;
    currentRouteOptions[kind] = options;

    const feature = routeFeature(routeData);
    if (!feature) {
        console.warn("Внимание: маршрут не содержит валидных данных (geometry/coordinates) для отрисовки.");
        return;
    }

    if (!mapInstance.isStyleLoaded()) {
        mapInstance.once("idle", () => {
            const latestRoute = currentRoutes[kind];
            if (latestRoute) drawRoute(mapInstance, latestRoute, currentRouteOptions[kind]);
        });
        return;
    }

    const isStraight = routeData.geometry_type === "straight" || routeData.is_fallback;
    const source = mapInstance.getSource(config.sourceId);

    if (source) {
        source.setData(feature);
    } else {
        mapInstance.addSource(config.sourceId, {
            type: "geojson",
            data: feature,
        });
    }

    if (!mapInstance.getLayer(config.layerId)) {
        mapInstance.addLayer({
            id: config.layerId,
            type: "line",
            source: config.sourceId,
            layout: {
                "line-cap": "round",
                "line-join": "round",
            },
            paint: {
                "line-color": options.color || config.color,
                "line-width": 6,
                "line-opacity": 0.68,
                "line-dasharray": isStraight ? [1.4, 1.4] : [1, 0],
                "line-offset": config.lineOffset,
            },
        });
    } else {
        mapInstance.setPaintProperty(config.layerId, "line-color", options.color || config.color);
        mapInstance.setPaintProperty(config.layerId, "line-dasharray", isStraight ? [1.4, 1.4] : [1, 0]);
        mapInstance.setPaintProperty(config.layerId, "line-offset", config.lineOffset);
    }
}
