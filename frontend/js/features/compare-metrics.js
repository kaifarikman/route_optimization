import { store } from "../state/store.js";

export function compareMetrics() {
    const { baseRoute, optimizedRoute } = store.getState();

    if (!baseRoute || !optimizedRoute) {
        return null;
    }

    const distanceBefore = baseRoute.distance_km;
    const distanceAfter = optimizedRoute.distance_km;
    const timeBefore = baseRoute.duration_minutes;
    const timeAfter = optimizedRoute.duration_minutes;

    if (distanceBefore === undefined || distanceAfter === undefined || timeBefore === undefined || timeAfter === undefined) {
        return null;
    }

    const distanceSaved = distanceBefore - distanceAfter;
    const timeSaved = timeBefore - timeAfter;
    let distancePercent = 0;
    if (distanceBefore > 0) {
        distancePercent = ((distanceBefore - distanceAfter) / distanceBefore) * 100;
    }

    return {
        distanceBefore,
        distanceAfter,
        distanceSaved,
        timeBefore,
        timeAfter,
        timeSaved,
        distancePercent
    };
}