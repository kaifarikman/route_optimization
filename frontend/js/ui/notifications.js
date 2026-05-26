// frontend/js/ui/notifications.js

export function notify(message, type = 'info') {
    const statusIndicator = document.getElementById('status-indicator');
    if (!statusIndicator) return;

    // Сразу принудительно ставим белый фон и черный текст для ВСЕХ сообщений
    statusIndicator.style.background = '#FFFFFF';
    statusIndicator.style.color = '#111827';

    // Записываем сам текст ошибки
    statusIndicator.textContent = message;

    if (type === 'error') {
        // Для ошибки делаем только строгую серую рамку. Текст остаётся ЧЕРНЫМ (#111827)
        statusIndicator.style.border = '1px solid #CBD2DA';
        statusIndicator.style.color = '#111827';
    } else if (type === 'loading') {
        statusIndicator.style.border = '1px solid #E2E8F0';
        statusIndicator.style.color = '#475569'; // Серый текст для загрузки
        statusIndicator.textContent = message + '...';
    } else {
        // Для статуса "Готово" или успеха делаем зеленую рамку и зеленый текст
        statusIndicator.style.border = '1px solid #BBF7D0';
        statusIndicator.style.color = '#16A34A';
    }
}