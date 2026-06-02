export function notify(message, type = 'info') {
    if (type === 'error') {
        console.error(message);
    }
}
