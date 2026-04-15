export function notify(message, type = 'info') {
    const statusIndicator = document.getElementById('status-indicator');
    if (!statusIndicator) return;

    statusIndicator.textContent = message;

    if (type === 'error') {
        statusIndicator.style.color = '#ff6666';
    } else if (type === 'loading') {
        statusIndicator.style.color = '#666';
        statusIndicator.textContent = message + '...';
    } else {
        statusIndicator.style.color = '#7bca8d';
    }
}