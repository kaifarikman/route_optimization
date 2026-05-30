import api from "../api/client.js";
import { store } from "../state/store.js";
import { resetMetrics } from "../ui/metrics.js";
import { notify } from "../ui/notifications.js";
import { pointWord } from "../utils/plural.js";
import { resetRouteVisibility } from "../map/route-visibility.js";

const MAX_IMPORT_POINTS = 50;

function normalizePoint(raw) {
    if (!raw || typeof raw !== "object") return null;
    const lat = Number(raw.lat);
    const lon = Number(raw.lng ?? raw.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return { lat, lon };
}

function parseJsonPoints(content) {
    const data = JSON.parse(content);
    const items = Array.isArray(data) ? data : data.points;
    if (!Array.isArray(items)) {
        return { validPoints: [], totalRows: 0, skippedInvalid: 0 };
    }

    const validPoints = [];
    let skippedInvalid = 0;

    items.forEach((item) => {
        const point = normalizePoint(item);
        if (point) {
            validPoints.push(point);
        } else {
            skippedInvalid += 1;
        }
    });

    return { validPoints, totalRows: items.length, skippedInvalid };
}

function parseCsvPoints(content) {
    const lines = content
        .replace(/^\uFEFF/, "")
        .trim()
        .split(/\r?\n/)
        .filter(Boolean);
    if (lines.length < 2) return { validPoints: [], totalRows: 0, skippedInvalid: 0 };

    const sep = lines[0].includes(";") ? ";" : ",";
    const headers = lines[0].split(sep).map(header => header.trim().toLowerCase());
    const latIndex = headers.findIndex(header => ["lat", "широта", "latitude"].includes(header));
    const lonIndex = headers.findIndex(header => ["lng", "lon", "долгота", "longitude"].includes(header));

    if (latIndex === -1 || lonIndex === -1) {
        return { validPoints: [], totalRows: Math.max(lines.length - 1, 0), skippedInvalid: Math.max(lines.length - 1, 0) };
    }

    const validPoints = [];
    let skippedInvalid = 0;

    lines.slice(1).forEach((line) => {
        const cols = line.split(sep);
        const point = normalizePoint({
            lat: cols[latIndex],
            lon: cols[lonIndex],
        });
        if (point) {
            validPoints.push(point);
        } else {
            skippedInvalid += 1;
        }
    });

    return { validPoints, totalRows: lines.length - 1, skippedInvalid };
}

export function parseFilePoints(content, filename) {
    const ext = filename.split(".").pop().toLowerCase();
    if (ext === "json") return parseJsonPoints(content);
    if (ext === "csv") return parseCsvPoints(content);
    return { validPoints: [], totalRows: 0, skippedInvalid: 0 };
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target.result);
        reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
        reader.readAsText(file);
    });
}

export function importSummary(importedCount, skippedInvalid, skippedByLimit) {
    const parts = [
        `Импортировано ${importedCount} ${pointWord(importedCount)}.`,
        `Пропущено ${skippedInvalid} невалидных.`,
    ];

    if (skippedByLimit > 0) {
        parts.push(`Ещё ${skippedByLimit} сверх лимита ${MAX_IMPORT_POINTS}.`);
    }

    return parts.join(" ");
}

async function importFile(file) {
    const state = store.getState();
    if (state.isLoading) return;

    let parseResult;
    try {
        const content = await readFile(file);
        parseResult = parseFilePoints(content, file.name);
    } catch (error) {
        notify("Пустой или битый файл", "error");
        return;
    }

    if (parseResult.validPoints.length === 0) {
        notify("Не найдено валидных точек в файле", "error");
        return;
    }

    const points = parseResult.validPoints.slice(0, MAX_IMPORT_POINTS);
    const skippedByLimit = Math.max(parseResult.validPoints.length - MAX_IMPORT_POINTS, 0);

    store.setState({ status: "loading", isLoading: true, loadingAction: "import" });

    try {
        const result = await api.importPoints(points);
        const imported = result.points || [];

        store.setState({
            points: imported,
            baseRoute: null,
            optimizedRoute: null,
            routeVisibility: resetRouteVisibility(),
            selectedRouteMode: "base",
            status: "idle",
            isLoading: false,
            loadingAction: null,
        });
        resetMetrics();

        notify(importSummary(imported.length, parseResult.skippedInvalid, skippedByLimit), "info");
    } catch (error) {
        store.setState({ status: "error", isLoading: false, loadingAction: null });
        notify("Ошибка импорта точек: " + error.message, "error");
    }
}

export function initImportControls() {
    const importBtn = document.getElementById("importPointsBtn");
    const fileInput = document.getElementById("importFileInput");
    if (!importBtn || !fileInput) return;

    importBtn.addEventListener("click", () => {
        if (store.getState().isLoading) return;
        fileInput.click();
    });

    fileInput.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        await importFile(file);
        fileInput.value = "";
    });
}
