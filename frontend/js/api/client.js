const API_BASE_URL = (window.APP_CONFIG?.API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

export class ApiClient {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    async request(method, endpoint, data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

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

    // Points endpoints
    async generatePoints(centerLat, centerLon, radius, count) {
        return this.request('POST', '/points/generate', {
            center_lat: centerLat,
            center_lon: centerLon,
            radius_km: radius,
            count: count
        });
    }

    async getPoints() {
        return this.request('GET', '/points');
    }

    async clearPoints() {
        return this.request('DELETE', '/points');
    }

    // Routes endpoints
    async buildBaseRoute(pointIds) {
        return this.request('POST', '/routes/base', {
            point_ids: pointIds
        });
    }

    async optimizeRoute(pointIds) {
        return this.request('POST', '/routes/optimize', {
            point_ids: pointIds
        });
    }

    async getRoute(routeId) {
        return this.request('GET', `/routes/${routeId}`);
    }

    async getAllRoutes() {
        return this.request('GET', '/routes');
    }

    // Service endpoints
    async checkHealth() {
        return this.request('GET', '/health');
    }

    async getConfig() {
        return this.request('GET', '/config');
    }
}

// Глобальный экземпляр клиента
const api = new ApiClient();
export default api;
