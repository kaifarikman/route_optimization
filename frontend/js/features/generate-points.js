import api from "../api/client.js";
import { store } from "../state/store.js";
import { notify } from "../ui/notifications.js";
import { resetMetrics } from "../ui/metrics.js";

function validateGenerationForm(countStr, latStr, lonStr, radiusStr) {
    if (!countStr.trim() || !latStr.trim() || !lonStr.trim() || !radiusStr.trim()) {
        return "Все поля должны быть заполнены";
    }
    const count = Number(countStr);
    const lat = Number(latStr);
    const lon = Number(lonStr);
    const radius = Number(radiusStr);
    if (!Number.isInteger(count) || count < 2 || count > 50) {
        return "Количество точек должно быть целым числом от 2 до 50";
    }

    if (isNaN(lat) || lat < -90 || lat > 90) {
        return "Широта центра (N) должна быть числом от -90 до 90";
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
        return "Долгота центра (W) должна быть числом от -180 до 180";
    }

    if (isNaN(radius) || radius <= 0 || radius > 50) {
        return "Радиус должен быть числом больше 0 и не более 50 км";
    }

    return null;
}

export async function extractText() {
    const state = store.getState();
    if (state.isLoading) return; // Блокировка повторного вызова

    const countRaw = document.getElementById("pointsInput").value;
    const northRaw = document.getElementById("northInput").value;
    const westRaw = document.getElementById("westInput").value;
    const radRaw = document.getElementById("radInput").value;

    const validationError = validateGenerationForm(countRaw, northRaw, westRaw, radRaw);

    if (validationError) {
        notify(validationError, "error");
        return;
    }
    const pointsValue = parseInt(countRaw, 10);
    const northValue = parseFloat(northRaw);
    const westValue = parseFloat(westRaw);
    const radValue = parseFloat(radRaw);

    store.setState({ status: 'loading', isLoading: true, loadingAction: 'generate' });

    try {
        const result = await api.generatePoints(northValue, westValue, radValue, pointsValue);

        store.setState({
            points: result.points,
            status: 'idle',
            isLoading: false,
            loadingAction: null,
            baseRoute: null,
            optimizedRoute: null,
            selectedRouteMode: 'base',
        });
        resetMetrics();

        notify(`Сгенерировано ${result.points.length} точек`, 'info');
    } catch (error) {
        console.error("Ошибка при генерации точек:", error);
        store.setState({ status: 'error', isLoading: false, loadingAction: null });
        notify("Ошибка при генерации точек: " + error.message, 'error');
    }
}