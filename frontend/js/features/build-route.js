import api from "../api/client.js";
import { store } from "../state/store.js";
import { updateMetrics } from "../ui/metrics.js";

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

        store.setState({
            baseRoute: result.route,
            selectedRouteMode: 'base',
            status: 'idle'
        });

        updateMetrics();
    } catch (error) {
        store.setState({ status: 'error' });
        //Обработка случая, когда бэкенд вернул "not implemented"
        const errorMsg = error.message.includes("not implemented")
            ? "Бэкенд: Логика построения маршрута еще не готова."
            : error.message;
        alert(errorMsg);
    }
}



