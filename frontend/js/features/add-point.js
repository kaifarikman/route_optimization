import api from "../api/client.js";
import { store } from "../state/store.js";
import { notify } from "../ui/notifications.js";
import { resetMetrics } from "../ui/metrics.js";

const MANUAL_INPUT_IDS = ["manualLatInput", "manualLonInput"];

function clearManualErrors() {
    MANUAL_INPUT_IDS.forEach(id => {
        document.getElementById(id)?.classList.remove("input-error");
    });
}

function setManualError(id, message) {
    document.getElementById(id)?.classList.add("input-error");
    notify(message, "error");
    return true;
}

function validateCoordInput(input, min, max) {
    if (!input) return true;
    const value = input.value.trim();
    const number = Number(value);
    const valid = value === "" || (!Number.isNaN(number) && number >= min && number <= max);
    input.classList.toggle("input-error", !valid);
    return valid;
}

export function initManualPointValidation() {
    const latInput = document.getElementById("manualLatInput");
    const lonInput = document.getElementById("manualLonInput");

    latInput?.addEventListener("input", () => validateCoordInput(latInput, -90, 90));
    lonInput?.addEventListener("input", () => validateCoordInput(lonInput, -180, 180));
}

function validateManualPoint(latStr, lonStr) {
    clearManualErrors();

    if (!latStr.trim()) return setManualError("manualLatInput", "Введите широту");
    if (!lonStr.trim()) return setManualError("manualLonInput", "Введите долготу");

    const lat = Number(latStr);
    const lon = Number(lonStr);

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
        return setManualError("manualLatInput", "Широта: от -90 до 90");
    }
    if (Number.isNaN(lon) || lon < -180 || lon > 180) {
        return setManualError("manualLonInput", "Долгота: от -180 до 180");
    }

    return null;
}

export async function addPointByCoordinates(lat, lon, successMessage = "Точка добавлена") {
    const state = store.getState();
    if (state.isLoading) return;

    store.setState({ status: "loading", isLoading: true, loadingAction: "add" });

    try {
        await api.addPoint(lat, lon);
        const pointsResult = await api.getPoints();

        store.setState({
            points: pointsResult.points || [],
            status: "idle",
            isLoading: false,
            loadingAction: null,
            baseRoute: null,
            optimizedRoute: null,
            selectedRouteMode: "base",
        });
        clearManualErrors();
        resetMetrics();
        notify(successMessage, "info");
    } catch (error) {
        store.setState({ status: "error", isLoading: false, loadingAction: null });
        notify("Ошибка добавления точки: " + error.message, "error");
    }
}

export async function addPointFromForm() {
    const state = store.getState();
    if (state.isLoading) return;

    const latRaw = document.getElementById("manualLatInput").value;
    const lonRaw = document.getElementById("manualLonInput").value;

    if (validateManualPoint(latRaw, lonRaw)) return;

    await addPointByCoordinates(Number(latRaw), Number(lonRaw));
}
