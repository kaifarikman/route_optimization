import api from "../api/client.js";
import { store } from "../state/store.js";
import { updateMetrics, resetMetrics } from "../ui/metrics.js";
import { notify } from "../ui/notifications.js";

export function getShareTokenFromUrl() {
    return new URLSearchParams(window.location.search).get("share");
}

export async function loadSharedRoute(token) {
    if (!token) return false;

    store.setState({ status: "loading", isLoading: true, loadingAction: "share-load" });

    try {
        const result = await api.getRouteShare(token);
        const share = result.share;

        store.setState({
            points: share.points || [],
            baseRoute: share.base_route || null,
            optimizedRoute: share.optimized_route || null,
            selectedRouteMode: "optimized",
            sharedView: true,
            status: "idle",
            isLoading: false,
            loadingAction: null,
        });
        resetMetrics();

        if (share.base_route) {
            updateMetrics(share.base_route, "base");
        }
        if (share.optimized_route) {
            updateMetrics(share.optimized_route, "optimized");
        } else if (share.base_route) {
            store.setState({ selectedRouteMode: "base" });
        }

        notify("Открыта ссылка на маршрут", "info");
        return true;
    } catch (error) {
        store.setState({
            sharedView: true,
            status: "error",
            isLoading: false,
            loadingAction: null,
        });
        notify("Ошибка открытия ссылки: " + error.message, "error");
        return false;
    }
}
