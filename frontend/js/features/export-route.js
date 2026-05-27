import api from "../api/client.js";
import { store } from "../state/store.js";
import { compareMetrics } from "./compare-metrics.js";
import { notify } from "../ui/notifications.js";

function pad(value) {
    return String(value).padStart(2, "0");
}

function fileTimestamp(date = new Date()) {
    return [
        date.getFullYear(),
        "-",
        pad(date.getMonth() + 1),
        "-",
        pad(date.getDate()),
        "_",
        pad(date.getHours()),
        "-",
        pad(date.getMinutes()),
    ].join("");
}

function routePointIds(route) {
    if (!route?.points) return [];
    return route.points.map(point => point.id || point);
}

function pointIndexMap(points) {
    return new Map(points.map((point, index) => [point.id, index + 1]));
}

function round(value, digits = 1) {
    return Number(value.toFixed(digits));
}

function routeExport(route, indexById, improvementPct = null) {
    if (!route) return null;

    const data = {
        order: routePointIds(route).map(id => indexById.get(id)).filter(Boolean),
        distance_km: round(route.distance_km),
        time_min: Math.round(route.duration_minutes),
        source: route.provider,
    };

    if (improvementPct !== null) {
        data.improvement_pct = round(improvementPct);
    }

    return data;
}

function currentCenter() {
    return {
        lat: Number(document.getElementById("northInput")?.value || 55.75),
        lng: Number(document.getElementById("westInput")?.value || 37.62),
    };
}

function buildJsonExport() {
    const state = store.getState();
    const indexById = pointIndexMap(state.points);
    const comparison = compareMetrics();

    return {
        version: 1,
        exported_at: new Date().toISOString(),
        city_center: currentCenter(),
        points: state.points.map((point, index) => ({
            index: index + 1,
            lat: point.lat,
            lng: point.lon,
            label: `Точка ${index + 1}`,
        })),
        base_route: routeExport(state.baseRoute, indexById),
        optimized_route: routeExport(
            state.optimizedRoute,
            indexById,
            comparison ? comparison.distancePercent : null,
        ),
    };
}

function csvValue(value) {
    const text = String(value ?? "");
    if (text.includes(";") || text.includes('"') || text.includes("\n")) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function csvLine(values) {
    return values.map(csvValue).join(";");
}

function activeRoute(state) {
    if (state.selectedRouteMode === "optimized" && state.optimizedRoute) return state.optimizedRoute;
    return state.optimizedRoute || state.baseRoute;
}

function buildCsvExport() {
    const state = store.getState();
    const route = activeRoute(state);
    const pointsById = new Map(state.points.map(point => [point.id, point]));
    const orderedIds = routePointIds(route);
    const comparison = compareMetrics();

    const lines = [csvLine(["Порядок", "Широта", "Долгота", "Тип"])];

    orderedIds.forEach((id, index) => {
        const point = pointsById.get(id);
        if (!point) return;
        let type = "точка";
        if (index === 0) type = "старт";
        if (index === orderedIds.length - 1) type = "финиш";
        lines.push(csvLine([index + 1, point.lat, point.lon, type]));
    });

    lines.push(csvLine(["", "", "", ""]));

    if (state.baseRoute) {
        lines.push(csvLine([
            "Базовый маршрут",
            `${round(state.baseRoute.distance_km)} км`,
            `${Math.round(state.baseRoute.duration_minutes)} мин`,
            "",
        ]));
    }
    if (state.optimizedRoute) {
        lines.push(csvLine([
            "Оптимизированный",
            `${round(state.optimizedRoute.distance_km)} км`,
            `${Math.round(state.optimizedRoute.duration_minutes)} мин`,
            "",
        ]));
    }
    if (comparison) {
        lines.push(csvLine(["Улучшение", `${round(comparison.distancePercent)}%`, "", ""]));
    }

    return `\uFEFF${lines.join("\r\n")}`;
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

async function copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const input = document.createElement("input");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
}

function hasRoute() {
    const state = store.getState();
    return Boolean(state.baseRoute || state.optimizedRoute);
}

export function initExportControls() {
    const jsonBtn = document.getElementById("exportJsonBtn");
    const csvBtn = document.getElementById("exportCsvBtn");
    const shareBtn = document.getElementById("shareRouteBtn");

    if (!jsonBtn || !csvBtn || !shareBtn) return;

    jsonBtn.addEventListener("click", () => {
        if (!hasRoute()) {
            notify("Сначала постройте маршрут", "error");
            return;
        }
        const filename = `маршрут_${fileTimestamp()}.json`;
        downloadFile(
            JSON.stringify(buildJsonExport(), null, 2),
            filename,
            "application/json;charset=utf-8",
        );
    });

    csvBtn.addEventListener("click", () => {
        if (!hasRoute()) {
            notify("Сначала постройте маршрут", "error");
            return;
        }
        const filename = `маршрут_${fileTimestamp()}.csv`;
        downloadFile(buildCsvExport(), filename, "text/csv;charset=utf-8");
    });

    shareBtn.addEventListener("click", async () => {
        const state = store.getState();
        if (!state.baseRoute || !state.optimizedRoute || state.sharedView) {
            notify("Сначала постройте и оптимизируйте маршрут", "error");
            return;
        }

        store.setState({ status: "loading", isLoading: true, loadingAction: "share" });
        try {
            const result = await api.createRouteShare(state.baseRoute.id, state.optimizedRoute.id);
            await copyToClipboard(result.share_url);
            store.setState({ status: "idle", isLoading: false, loadingAction: null });
            notify("Ссылка скопирована", "info");
        } catch (error) {
            store.setState({ status: "error", isLoading: false, loadingAction: null });
            notify("Ошибка создания ссылки: " + error.message, "error");
        }
    });

    store.subscribe((state) => {
        const disabled = !(state.baseRoute || state.optimizedRoute) || state.isLoading;
        jsonBtn.disabled = disabled;
        csvBtn.disabled = disabled;
        shareBtn.disabled = !state.baseRoute || !state.optimizedRoute || state.isLoading || state.sharedView;
    });
}
