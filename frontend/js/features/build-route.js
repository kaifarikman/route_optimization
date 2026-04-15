import api from "../api/client.js";
import { store } from "../state/store.js";
import { updateMetrics } from "../ui/metrics.js";

export async function buildRoute() {
    const state = store.getState();

    if (!state.points || state.points.length === 0) {
        alert("Сначала сгенерируйте точки!");
        return;
    }

    if (state.baseRoute) {
        store.setState({ selectedRouteMode: 'base' });
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

        updateMetrics();
    } catch (error) {
        store.setState({ status: 'error' });
        const errorMsg = error.message.includes("not implemented")
            ? "Бэкенд: Логика построения маршрута еще не готова."
            : error.message;
        alert(errorMsg);
    }
}


