const USER_ID_KEY = "route_user_id";

function fallbackUuidV4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
        const value = Math.floor(Math.random() * 16);
        const uuidValue = char === "x" ? value : (value & 0x3) | 0x8;
        return uuidValue.toString(16);
    });
}

export function getUserId() {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : fallbackUuidV4();
        localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
}
