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

    const distanceSavedKm = Math.max(Number(comparison.distanceSaved) || 0, 0);
    const timeSavedMinutes = Math.max(Number(comparison.timeSaved) || 0, 0);
    const rubPerKm = parseSavingsCoefficient(coefficients.rubPerKm);
    const rubPerMinute = parseSavingsCoefficient(coefficients.rubPerMinute);

    return {
        distanceSavedKm,
        timeSavedMinutes,
        rubPerKm,
        rubPerMinute,
        rubles: distanceSavedKm * rubPerKm + timeSavedMinutes * rubPerMinute,
    };
}
