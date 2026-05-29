import api from "../api/client.js";
import { store } from "../state/store.js";
import { notify } from "../ui/notifications.js";
import { resetMetrics } from "../ui/metrics.js";
import { generatedPointsMessage } from "../utils/plural.js";

function clearErrors() {
    ['pointsInput', 'northInput', 'westInput', 'radInput'].forEach(id => {
        document.getElementById(id)?.classList.remove('input-error');
    });
}
function setError(id, message) {
    document.getElementById(id)?.classList.add('input-error');
    notify(message, "error");
    return true;
}
function validateForm(countStr, latStr, lonStr, radiusStr) {
    clearErrors();

    if (!countStr.trim()) return setError('pointsInput', "Введите количество точек");
    if (!latStr.trim()) return setError('northInput', "Введите широту");
    if (!lonStr.trim()) return setError('westInput', "Введите долготу");
    if (!radiusStr.trim()) return setError('radInput', "Введите радиус");

    const count = Number(countStr);
    const lat = Number(latStr);
    const lon = Number(lonStr);
    const radius = Number(radiusStr);

    if (!Number.isInteger(count) || count < 2 || count > 50) {
        return setError('pointsInput', "Количество точек: от 2 до 50");
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
        return setError('northInput', "Широта: от -90 до 90");
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
        return setError('westInput', "Долготу: от -180 до 180");
    }
    if (isNaN(radius) || radius < 0.1 || radius > 50) {
        return setError('radInput', "Радиус: от 0.1 до 50 км");
    }

    return null;
}

export async function extractText() {
    const state = store.getState();
    if (state.isLoading) return;

    const countRaw = document.getElementById("pointsInput").value;
    const northRaw = document.getElementById("northInput").value;
    const westRaw = document.getElementById("westInput").value;
    const radRaw = document.getElementById("radInput").value;

    if (validateForm(countRaw, northRaw, westRaw, radRaw)) return;

    const pointsValue = parseInt(countRaw, 10);
    const northValue = parseFloat(northRaw);
    const westValue = parseFloat(westRaw);
    const radValue = parseFloat(radRaw);

    store.setState({ status: 'loading', isLoading: true, loadingAction: 'generate' });

    try {
        const result = await api.generatePoints(northValue, westValue, radValue, pointsValue);
        store.setState({
            points: result.points || [],
            status: 'idle',
            isLoading: false,
            loadingAction: null,
            baseRoute: null,
            optimizedRoute: null,
            selectedRouteMode: 'base',
        });
        resetMetrics();

        const count = result.points ? result.points.length : 0;
        notify(generatedPointsMessage(count), 'info');

    } catch (error) {
        store.setState({ status: 'error', isLoading: false, loadingAction: null });
        notify("Ошибка генерации точек: " + error.message, "error");
    }
}
