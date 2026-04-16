import api from "../api/client.js";
import { store } from "../state/store.js";
import { updateMetrics } from "../ui/metrics.js";
import { notify } from "../ui/notifications.js";

export async function buildRoute() {
    const state = store.getState();

    if (!state.points || state.points.length < 2) {
        notify("Недостаточное количество точек", "error");
        return;
    }

    store.setState({ status: 'loading' });

    try {
        const pointIds = state.points.map(p => p.id);
        const result = await api.buildBaseRoute(pointIds);

        store.setState({
            baseRoute: result.route,
            selectedRouteMode: 'base',
            status: 'idle'
        });

        updateMetrics(result.route, 'base');
        notify("Базовый маршрут построен", "info");
    } catch (error) {
        store.setState({ status: 'error' });
        notify("Ошибка построения маршрута: " + error.message, "error");
    }
}
