import api from "../api/client.js";
import { renderPoints } from "../map/markers.js";

export async function extractText() {
    const pointsValue = parseInt(document.getElementById("pointsInput").value, 10) || 5;
    const westValue = parseFloat(document.getElementById("westInput").value) || 20.22;
    const northValue = parseFloat(document.getElementById("northInput").value) || 20.22;
    const radValue = parseFloat(document.getElementById("radInput").value) || 50;

    try {
        const result = await api.generatePoints(northValue, westValue, radValue, pointsValue);
        renderPoints(window.map, result.points);

        if (result.points.length > 0) {
            window.map.setView([result.points[0].lat, result.points[0].lon], 10);
        } else {
            window.map.setView([northValue, westValue], 10);
        }

        alert(`Сгенерировано ${result.points.length} точек`);
    } catch (error) {
        console.error("Ошибка при генерации точек:", error);
        alert("Ошибка при генерации точек: " + error.message);
    }
}
