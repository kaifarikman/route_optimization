import api from "../api/client.js";
import { store } from "../state/store.js";
import { notify } from "../ui/notifications.js";
import { resetMetrics } from "../ui/metrics.js";


function validateGenerationForm(count, lat, lon, radius) {
    if (!Number.isInteger(count) || count <= 0) {
        return "Количество точек должно быть положительным целым числом";
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return "Координаты центра должны быть числами";
    }

    if (!Number.isFinite(radius) || radius <= 0) {
        return "Радиус должен быть положительным числом";
    }

    return null;
}

export async function extractText() {
    const pointsValue = parseInt(document.getElementById("pointsInput").value, 10) || 5;
    const westValue = parseFloat(document.getElementById("westInput").value) || 20.22;
    const northValue = parseFloat(document.getElementById("northInput").value) || 20.22;
    const radValue = parseFloat(document.getElementById("radInput").value) || 50;
    const validationError = validateGenerationForm(pointsValue, northValue, westValue, radValue);

    if (validationError) {
        notify(validationError, "error");
        return;
    }

    store.setState({ status: 'loading' });

    try {
        const result = await api.generatePoints(northValue, westValue, radValue, pointsValue);

        store.setState({
            points: result.points,
            status: 'idle',
            baseRoute: null,
            optimizedRoute: null,
            selectedRouteMode: 'base',
        });
        resetMetrics();

        notify(`Сгенерировано ${result.points.length} точек`, 'info');
    } catch (error) {
        console.error("Ошибка при генерации точек:", error);
        store.setState({ status: 'error' });
        notify("Ошибка при генерации точек: " + error.message, 'error');
    }
}
