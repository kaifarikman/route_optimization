export function compareMetrics(base, optimized) {
    if (!base || !optimized) return null;
    const diff = base.distance_km - optimized.distance_km;
    const percent = ((diff / base.distance_km) * 100).toFixed(1);
    return diff > 0 ? `Экономия: ${diff.toFixed(2)} км (${percent}%)` : null;
}