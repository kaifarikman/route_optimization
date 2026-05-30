export const ROUTE_COLORS = {
    base: "#3388ff",
    optimized: "#4CAF50",
};

export const DEFAULT_ROUTE_VISIBILITY = Object.freeze({
    base: false,
    optimized: false,
});

export function routeVisibilityState(routeVisibility = DEFAULT_ROUTE_VISIBILITY) {
    const visibility = routeVisibility || DEFAULT_ROUTE_VISIBILITY;
    return {
        base: !!visibility.base,
        optimized: !!visibility.optimized,
    };
}

export function resetRouteVisibility() {
    return routeVisibilityState();
}

export function enableRouteVisibility(routeVisibility, kind) {
    return {
        ...routeVisibilityState(routeVisibility),
        [kind]: true,
    };
}

export function isRouteVisible(state, kind) {
    return !!state?.[`${kind}Route`] && !!routeVisibilityState(state.routeVisibility)[kind];
}

export function routeForMode(state, mode) {
    if (mode === "optimized") return state.optimizedRoute;
    if (mode === "base") return state.baseRoute;
    return null;
}

export function visibleRouteForMode(state, mode) {
    if (!isRouteVisible(state, mode)) return null;

    return {
        mode,
        route: routeForMode(state, mode),
        color: ROUTE_COLORS[mode],
    };
}

export function activeVisibleRoute(state) {
    return (
        visibleRouteForMode(state, state.selectedRouteMode)
        || visibleRouteForMode(state, "base")
        || visibleRouteForMode(state, "optimized")
        || { mode: null, route: null, color: ROUTE_COLORS.base }
    );
}

export function visibleRouteMode(state, routeVisibility = state.routeVisibility) {
    const visibility = routeVisibilityState(routeVisibility);
    if (visibility[state.selectedRouteMode] && routeForMode(state, state.selectedRouteMode)) {
        return state.selectedRouteMode;
    }
    if (visibility.base && state.baseRoute) return "base";
    if (visibility.optimized && state.optimizedRoute) return "optimized";
    return null;
}

export function nextRouteToggleState(state, mode) {
    if (!routeForMode(state, mode)) return null;

    const visibility = routeVisibilityState(state.routeVisibility);
    const nextVisibility = {
        ...visibility,
        [mode]: !visibility[mode],
    };
    const nextMode = nextVisibility[mode] ? mode : visibleRouteMode(state, nextVisibility);
    const updates = { routeVisibility: nextVisibility };

    if (nextMode) {
        updates.selectedRouteMode = nextMode;
    }

    return updates;
}
