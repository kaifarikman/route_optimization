import api from "../api/client.js";
import { store } from "../state/store.js";

export async function buildRoute() {
    const { points } = store.getState();
    if (!points || points.length === 0) {
        alert("Сначала сгенерируйте точки!");
        return;
    }

    store.setState({ status: 'loading' });

    try {
        const pointIds = points.map(p => p.id);
        const result = await api.buildBaseRoute(pointIds);

        //Сохраняем данные в store
        store.setState({
            baseRoute: result.route,
            selectedRouteMode: 'base',
            status: 'idle'
        });

        const metrics = document.getElementById('baseMetrics');
        if (metrics) {
            metrics.textContent = `${result.route.distance_km} км | ${result.route.duration_minutes} мин`;
        }
    } catch (error) {
        store.setState({ status: 'error' });
        alert("Ошибка построения: " + error.message);
    }
}


