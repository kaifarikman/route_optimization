import { store } from "../state/store.js";

export function compareMetrics() {
    const { baseRoute, optimizedRoute } = store.getState();

    if (!baseRoute || !optimizedRoute) {
        return null;
    }

    const distanceSaved = baseRoute.distance_km - optimizedRoute.distance_km;
    const timeSaved = baseRoute.duration_minutes - optimizedRoute.duration_minutes;

    return {
        distanceBefore: baseRoute.distance_km,
        distanceAfter: optimizedRoute.distance_km,
        distanceSaved,
        timeBefore: baseRoute.duration_minutes,
        timeAfter: optimizedRoute.duration_minutes,
        timeSaved,
    };
}
