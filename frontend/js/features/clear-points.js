import api from "../api/client.js";
import { store } from "../state/store.js";
import { resetMetrics } from "../ui/metrics.js";
import { notify } from "../ui/notifications.js";


export async function clearPoints() {
    store.setState({ status: 'loading' });

    try {
        await api.clearPoints();

        store.setState({
            points: [],
            baseRoute: null,
            optimizedRoute: null,
            selectedRouteMode: 'base',
            status: 'idle',
        });
        resetMetrics();
        notify("Точки и маршруты сброшены", "info");
    } catch (error) {
        store.setState({ status: 'error' });
        notify("Ошибка очистки точек: " + error.message, "error");
    }
}
