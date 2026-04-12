import api from "../api/client.js";
import { store } from "../state/store.js";

export async function extractText() {
    const pointsValue = parseInt(document.getElementById("pointsInput").value, 10) || 5;
    const westValue = parseFloat(document.getElementById("westInput").value) || 20.22;
    const northValue = parseFloat(document.getElementById("northInput").value) || 20.22;
    const radValue = parseFloat(document.getElementById("radInput").value) || 50;

    store.setState({ status: 'loading' });

    try {
        const result = await api.generatePoints(northValue, westValue, radValue, pointsValue);

        // Обновляем единое состояние приложения
        store.setState({
            points: result.points,
            status: 'idle',
            baseRoute: null,
            optimizedRoute: null
        });

        alert(`Сгенерировано ${result.points.length} точек`);
    } catch (error) {
        console.error("Ошибка при генерации точек:", error);
        store.setState({ status: 'error' });
        alert("Ошибка при генерации точек: " + error.message);
    }
}


