const initialState = {
    points: [],
    baseRoute: null,
    optimizedRoute: null,
    selectedRouteMode: 'base',
    status: 'idle'
};

let state = { ...initialState };
let listeners = [];

export const store = {
    getState() {
        return state;
    },
    setState(updates) {
        state = { ...state, ...updates };
        listeners.forEach(listener => listener(state));
    },
    subscribe(listener) {
        listeners.push(listener);
        listener(state); // Сразу уведомляем подписчика о текущем состоянии
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    }
};