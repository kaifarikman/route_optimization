import api from "../api/client.js";
import { store } from "../state/store.js";
import { updateMetrics } from "../ui/metrics.js";
import { notify } from "../ui/notifications.js";

export async function optimizeRoute() {
    const state = store.getState();
    if (state.isLoading) return; // Блокировка повторного вызова

    if (!state.points || state.points.length < 2) {
        notify("Недостаточное количество точек", "error");
        return;
    }

    store.setState({ status: 'loading', isLoading: true, loadingAction: 'optimize' });

    try {
        const pointIds = state.points.map(p => p.id);
        const result = await api.optimizeRoute(pointIds);

        store.setState({
            optimizedRoute: result.route,
            selectedRouteMode: 'optimized',
            status: 'idle',
            isLoading: false,
            loadingAction: null
        });

        updateMetrics(result.route, 'optimized');
        notify("Оптимизированный маршрут построен", "info");
    } catch (error) {
        store.setState({ status: 'error', isLoading: false, loadingAction: null });
        notify("Ошибка оптимизации: " + error.message, "error");
    }
}


