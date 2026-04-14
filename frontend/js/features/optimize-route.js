import api from "../api/client.js";
import { store } from "../state/store.js";

export async function optimizeRoute() {
    const { points } = store.getState();
    if (!points || points.length === 0) {
        alert("Сначала сгенерируйте точки!");
        return;
    }

    store.setState({ status: 'loading' });

    try {
        const pointIds = points.map(p => p.id);
        const result = await api.optimizeRoute(pointIds);

        store.setState({
            optimizedRoute: result.route,
            selectedRouteMode: 'optimized',
            status: 'idle'
        });

        const metrics = document.getElementById('optimizedMetrics');
        if (metrics) {
            metrics.textContent = `${result.route.distance_km} км | ${result.route.duration_minutes} мин`;
        }
    } catch (error) {
        store.setState({ status: 'error' });
        alert("Ошибка оптимизации: " + error.message);
    }
}




