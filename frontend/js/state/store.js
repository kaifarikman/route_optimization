const initialState = {
    points: [],
    baseRoute: null,
    optimizedRoute: null,
    selectedRouteMode: 'base',
    sharedView: false,
    status: 'idle',
    isLoading: false,
    loadingAction: null
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
        listener(state);
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    }
};
