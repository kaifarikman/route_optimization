export function parseSavingsCoefficient(value) {
    if (value === null || value === undefined) return 0;

    const normalized = String(value).trim().replace(',', '.');
    if (!normalized) return 0;

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;

    return parsed;
}

export function estimateSavings(comparison, coefficients = {}) {
    if (!comparison) return null;

    // Реальные (знаковые) изменения для отображения: плюс — лучше, минус — хуже.
    const distanceSavedKm = Number(comparison.distanceSaved) || 0;
    const timeSavedMinutes = Number(comparison.timeSaved) || 0;
    const rubPerKm = parseSavingsCoefficient(coefficients.rubPerKm);
    const rubPerMinute = parseSavingsCoefficient(coefficients.rubPerMinute);

    // В рубли идёт только реальная экономия каждого показателя: если маршрут
    // где-то стал хуже, этот минус не вычитается из суммы (деньги не уходят в минус).
    const rubles =
        Math.max(distanceSavedKm, 0) * rubPerKm +
        Math.max(timeSavedMinutes, 0) * rubPerMinute;

    return {
        distanceSavedKm,
        timeSavedMinutes,
        rubPerKm,
        rubPerMinute,
        rubles,
    };
}
