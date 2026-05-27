import api from "../api/client.js";
import { store } from "../state/store.js";
import { resetMetrics } from "../ui/metrics.js";
import { notify } from "../ui/notifications.js";

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
    if (!Array.isArray(items)) return [];
    return items.map(normalizePoint).filter(Boolean);
}

function parseCsvPoints(content) {
    const lines = content
        .replace(/^\uFEFF/, "")
        .trim()
        .split(/\r?\n/)
        .filter(Boolean);
    if (lines.length < 2) return [];

    const sep = lines[0].includes(";") ? ";" : ",";
    const headers = lines[0].split(sep).map(header => header.trim().toLowerCase());
    const latIndex = headers.findIndex(header => ["lat", "широта", "latitude"].includes(header));
    const lonIndex = headers.findIndex(header => ["lng", "lon", "долгота", "longitude"].includes(header));

    if (latIndex === -1 || lonIndex === -1) return [];

    return lines.slice(1)
        .map((line) => {
            const cols = line.split(sep);
            return normalizePoint({
                lat: cols[latIndex],
                lon: cols[lonIndex],
            });
        })
        .filter(Boolean);
}

function parseFilePoints(content, filename) {
    const ext = filename.split(".").pop().toLowerCase();
    if (ext === "json") return parseJsonPoints(content);
    if (ext === "csv") return parseCsvPoints(content);
    return [];
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target.result);
        reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
        reader.readAsText(file);
    });
}

function pluralPoints(count) {
    const cases = [2, 0, 1, 1, 1, 2];
    const forms = ["точка", "точки", "точек"];
    return forms[(count % 100 > 4 && count % 100 < 20) ? 2 : cases[(count % 10 < 5) ? count % 10 : 5]];
}

async function importFile(file) {
    const state = store.getState();
    if (state.isLoading) return;

    let parsedPoints;
    try {
        const content = await readFile(file);
        parsedPoints = parseFilePoints(content, file.name);
    } catch (error) {
        notify("Пустой или битый файл", "error");
        return;
    }

    if (parsedPoints.length === 0) {
        notify("Не найдено валидных точек в файле", "error");
        return;
    }

    const total = parsedPoints.length;
    const points = parsedPoints.slice(0, MAX_IMPORT_POINTS);

    store.setState({ status: "loading", isLoading: true, loadingAction: "import" });

    try {
        const result = await api.importPoints(points);
        const imported = result.points || [];

        store.setState({
            points: imported,
            baseRoute: null,
            optimizedRoute: null,
            selectedRouteMode: "base",
            status: "idle",
            isLoading: false,
            loadingAction: null,
        });
        resetMetrics();

        if (total > MAX_IMPORT_POINTS) {
            notify(`Загружено ${MAX_IMPORT_POINTS} из ${total} точек (лимит). Импортировано ${imported.length} ${pluralPoints(imported.length)} из файла`, "info");
        } else {
            notify(`Импортировано ${imported.length} ${pluralPoints(imported.length)} из файла`, "info");
        }
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
