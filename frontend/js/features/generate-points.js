import api from "../api/client.js";
import { store } from "../state/store.js";
import { notify } from "../ui/notifications.js";

export async function extractText() {
    const pointsValue = parseInt(document.getElementById("pointsInput").value, 10) || 5;
    const westValue = parseFloat(document.getElementById("westInput").value) || 20.22;
    const northValue = parseFloat(document.getElementById("northInput").value) || 20.22;
    const radValue = parseFloat(document.getElementById("radInput").value) || 50;

    store.setState({ status: 'loading' });

    try {
        const result = await api.generatePoints(northValue, westValue, radValue, pointsValue);

        store.setState({
            points: result.points,
            status: 'idle',
            baseRoute: null,
            optimizedRoute: null
        });

        notify(`Сгенерировано ${result.points.length} точек`, 'info'); // Замена alert
    } catch (error) {
        console.error("Ошибка при генерации точек:", error);
        store.setState({ status: 'error' });
        notify("Ошибка при генерации точек: " + error.message, 'error'); // Замена alert
    }
}


