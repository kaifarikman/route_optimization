// Управление картой с помощью Leaflet
window.map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(window.map);

window.generatedPoints = [];
window.markers = [];

window.addEventListener('resize', function() {
    window.map.invalidateSize();
});