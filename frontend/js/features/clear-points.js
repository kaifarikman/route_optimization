import api from "../api/client.js";
import { store } from "../state/store.js";
import { resetMetrics } from "../ui/metrics.js";
import { notify } from "../ui/notifications.js";

function clearInputErrors() {
    [
        "pointsInput",
        "northInput",
        "westInput",
        "radInput",
        "manualLatInput",
        "manualLonInput",
    ].forEach(id => {
        document.getElementById(id)?.classList.remove("input-error");
    });
}

export async function clearPoints() {
    const state = store.getState();
    if (state.isLoading) return;

    store.setState({ status: 'loading', isLoading: true, loadingAction: 'clear' });

    try {
        await api.clearPoints();

        store.setState({
            points: [],
            baseRoute: null,
            optimizedRoute: null,
            selectedRouteMode: 'base',
            sharedView: false,
            status: 'idle',
            isLoading: false,
            loadingAction: null
        });
        if (window.location.search) {
            window.history.replaceState({}, "", window.location.pathname);
        }
        clearInputErrors();
        resetMetrics();
        notify("Новый маршрут готов", "info");
    } catch (error) {
        store.setState({ status: 'error', isLoading: false, loadingAction: null });
        notify("Ошибка очистки точек: " + error.message, "error");
    }
}
