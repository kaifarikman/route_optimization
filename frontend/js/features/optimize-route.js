import api from "../api/client.js";
import { store } from "../state/store.js";
import { updateMetrics } from "../ui/metrics.js"; // Обязательно импортируем метрики

export async function optimizeRoute() {
    const state = store.getState();

    if (!state.points || state.points.length === 0) {
        alert("Сначала сгенерируйте точки!");
        return;
    }

    if (state.optimizedRoute) {
        store.setState({ selectedRouteMode: 'optimized' });
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

        updateMetrics(); //Обновляем UI после получения маршрута

    } catch (error) {
        store.setState({ status: 'error' });
        alert("Ошибка оптимизации: " + error.message);
    }
}


