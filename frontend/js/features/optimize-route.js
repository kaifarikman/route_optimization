import api from "../api/client.js";
import { store } from "../state/store.js";
import { updateMetrics } from "../ui/metrics.js";
import { notify } from "../ui/notifications.js";

export async function optimizeRoute() {
    const state = store.getState();

    if (!state.points || state.points.length < 2) {
        notify("Недостаточное количество точек", "error");
        return;
    }

    store.setState({ status: 'loading' });

    try {
        const pointIds = state.points.map(p => p.id);
        const result = await api.optimizeRoute(pointIds);

        store.setState({
            optimizedRoute: result.route,
            selectedRouteMode: 'optimized',
            status: 'idle'
        });

        updateMetrics(result.route, 'optimized');
        notify("Оптимизированный маршрут построен", "info");
    } catch (error) {
        store.setState({ status: 'error' });
        notify("Ошибка оптимизации: " + error.message, "error");
    }
}
