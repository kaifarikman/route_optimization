import { getUserId } from "./user-id.js";

const API_BASE_URL = (window.APP_CONFIG?.API_BASE_URL || "/api").replace(/\/$/, "");

export class ApiClient {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    async request(method, endpoint, data = null, optionsOverride = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const includeUserHeader = optionsOverride.includeUserHeader !== false;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (includeUserHeader) {
            options.headers['X-User-Id'] = getUserId();
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || `Ошибка: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error (${method} ${endpoint}):`, error);
            throw error;
        }
    }

    async generatePoints(centerLat, centerLon, radius, count) {
        return this.request('POST', '/points/generate', {
            center_lat: centerLat,
            center_lon: centerLon,
            radius_km: radius,
            count: count
        });
    }

    async addPoint(lat, lon, metadata = {}) {
        return this.request('POST', '/points', {
            lat: lat,
            lon: lon,
            ...metadata
        });
    }
    async getPoints() {
        return this.request('GET', '/points');
    }

    async clearPoints() {
        return this.request('DELETE', '/points');
    }

    async importPoints(points) {
        return this.request('POST', '/points/import', { points });
    }

    async geocode(query, limit = 5) {
        return this.request('POST', '/geocode', { query, limit });
    }

    async reverseGeocode(lat, lon) {
        return this.request('POST', '/geocode/reverse', { lat, lon });
    }

    async buildBaseRoute(pointIds) {
        return this.request('POST', '/routes/base', {
            point_ids: pointIds
        });
    }

    async optimizeRoute(pointIds, algorithm = 'nearest_neighbor') {
        return this.request('POST', '/routes/optimize', {
            point_ids: pointIds,
            algorithm: algorithm
        });
    }

    async getRoute(routeId) {
        return this.request('GET', `/routes/${routeId}`);
    }

    async createRouteShare(baseRouteId, optimizedRouteId) {
        return this.request('POST', '/routes/share', {
            base_route_id: baseRouteId,
            optimized_route_id: optimizedRouteId
        });
    }

    async getRouteShare(token) {
        return this.request('GET', `/routes/share/${encodeURIComponent(token)}`, null, {
            includeUserHeader: false,
        });
    }
}

const api = new ApiClient();
export default api;
