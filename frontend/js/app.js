import { store } from './state/store.js';
import { extractText } from './features/generate-points.js';
import { initMapSubscription } from './map/map.js';

// 1. Создаем карту
const map = L.map('map').setView([20.22, 20.22], 10);

// 2. Добавляем слой тайлов
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// 3. Подключаем подписки и исправления размеров
initMapSubscription(map);

// 4. Навешиваем события
document.getElementById('generateBtn')?.addEventListener('click', extractText);

// 5. Глобальный статус приложения
const statusElement = document.getElementById('status-indicator');
store.subscribe((state) => {
    if (statusElement) {
        statusElement.textContent = state.status === 'loading' ? 'Вычисления...' : 'Готово';
    }
});