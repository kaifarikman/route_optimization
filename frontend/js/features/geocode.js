import api from "../api/client.js";
import { store } from "../state/store.js";
import { addPointByCoordinates } from "./add-point.js";
import { notify } from "../ui/notifications.js";

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function geocodeResultLabel(result) {
    if (!result) return "";
    const main = result.display_name || `${result.lat}, ${result.lon}`;
    return main.trim();
}

export function geocodePointMetadata(result, addressOverride = null) {
    const address = String(addressOverride ?? result.display_name ?? "").trim();
    return {
        address,
        geocoding_provider: result.provider,
        geocoding_place_id: result.place_id,
    };
}

function renderResults(container, results, onSelect) {
    if (!container) return;
    container.innerHTML = "";

    if (!results.length) {
        container.hidden = true;
        return;
    }

    results.forEach((result, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "geocode-result";
        button.innerHTML = `
            <span class="geocode-result-title">${escapeHtml(geocodeResultLabel(result))}</span>
            <span class="geocode-result-coord">${Number(result.lat).toFixed(5)}, ${Number(result.lon).toFixed(5)}</span>
        `;
        button.addEventListener("click", () => onSelect(result, index));
        container.appendChild(button);
    });

    container.hidden = false;
}

async function searchAddress(query) {
    const cleaned = query.trim();
    if (cleaned.length < 3) {
        notify("Введите адрес минимум из 3 символов", "error");
        return [];
    }

    const response = await api.geocode(cleaned, 5);
    return response.results || [];
}

function setCenter(result) {
    const latInput = document.getElementById("northInput");
    const lonInput = document.getElementById("westInput");
    if (latInput) latInput.value = Number(result.lat).toFixed(6);
    if (lonInput) lonInput.value = Number(result.lon).toFixed(6);
    notify("Центр найден", "info");
}

async function runCenterSearch() {
    if (store.getState().isLoading) return;

    const input = document.getElementById("centerAddressInput");
    const resultsBox = document.getElementById("centerGeocodeResults");
    if (!input || !resultsBox) return;

    store.setState({ status: "loading", isLoading: true, loadingAction: "geocode" });
    try {
        const results = await searchAddress(input.value);
        store.setState({ status: "idle", isLoading: false, loadingAction: null });
        if (results.length === 0) {
            resultsBox.hidden = true;
            notify("Адрес не найден", "error");
            return;
        }
        if (results.length === 1) {
            setCenter(results[0]);
            resultsBox.hidden = true;
            return;
        }
        renderResults(resultsBox, results, (result) => {
            setCenter(result);
            resultsBox.hidden = true;
        });
        notify("Выберите подходящий адрес", "info");
    } catch (error) {
        store.setState({ status: "error", isLoading: false, loadingAction: null });
        notify("Ошибка геокодинга: " + error.message, "error");
    }
}

async function addManualAddress(result, addressQuery) {
    await addPointByCoordinates(
        Number(result.lat),
        Number(result.lon),
        "Точка добавлена по адресу",
        geocodePointMetadata(result, addressQuery),
    );
}

async function runManualSearch() {
    if (store.getState().isLoading) return;

    const input = document.getElementById("manualAddressInput");
    const resultsBox = document.getElementById("manualGeocodeResults");
    if (!input || !resultsBox) return;

    const addressQuery = input.value.trim();
    store.setState({ status: "loading", isLoading: true, loadingAction: "geocode" });
    try {
        const results = await searchAddress(addressQuery);
        store.setState({ status: "idle", isLoading: false, loadingAction: null });
        if (results.length === 0) {
            resultsBox.hidden = true;
            notify("Адрес не найден", "error");
            return;
        }
        if (results.length === 1) {
            resultsBox.hidden = true;
            await addManualAddress(results[0], addressQuery);
            return;
        }
        renderResults(resultsBox, results, async (result) => {
            resultsBox.hidden = true;
            await addManualAddress(result, addressQuery);
        });
        notify("Выберите подходящий адрес", "info");
    } catch (error) {
        store.setState({ status: "error", isLoading: false, loadingAction: null });
        notify("Ошибка геокодинга: " + error.message, "error");
    }
}

export function initGeocodeControls() {
    const centerBtn = document.getElementById("centerGeocodeBtn");
    const manualBtn = document.getElementById("manualGeocodeBtn");
    const centerInput = document.getElementById("centerAddressInput");
    const manualInput = document.getElementById("manualAddressInput");

    if (centerBtn && !centerBtn.dataset.bound) {
        centerBtn.addEventListener("click", runCenterSearch);
        centerBtn.dataset.bound = "true";
    }
    if (manualBtn && !manualBtn.dataset.bound) {
        manualBtn.addEventListener("click", runManualSearch);
        manualBtn.dataset.bound = "true";
    }
    centerInput?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") runCenterSearch();
    });
    manualInput?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") runManualSearch();
    });

    store.subscribe((state) => {
        [centerBtn, manualBtn].forEach((button) => {
            if (!button) return;
            button.disabled = state.isLoading || state.sharedView;
        });
    });
}
