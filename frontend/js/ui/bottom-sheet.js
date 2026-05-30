// frontend/js/ui/bottom-sheet.js
// Управление мобильной шторкой (bottom sheet): свёрнут / половина / полный.
// Активно только при ширине экрана ≤ 768px. На десктопе ничего не делает.

const MOBILE_BREAKPOINT = 768;

// Доли высоты окна для расчёта позиций
const SHEET_HEIGHT_RATIO = 0.88; // высота самой шторки
const COLLAPSED_PEEK_PX = 96;     // сколько видно в свёрнутом состоянии

function isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
}

function snapOffsets() {
    const vh = window.innerHeight;
    const sheetH = vh * SHEET_HEIGHT_RATIO;
    return {
        full: 0,                       // раскрыт полностью
        half: sheetH - vh * 0.5,       // примерно половина экрана
        collapsed: sheetH - COLLAPSED_PEEK_PX, // видна только ручка
    };
}

export function initBottomSheet() {
    const sheet = document.querySelector('.sidebar');
    const handle = document.getElementById('sheetHandle');
    const content = document.querySelector('.sidebar-content');
    if (!sheet || !handle) return;

    // Текущее снап-состояние
    let state = 'collapsed';

    function applyState(next) {
        state = next;
        if (!isMobile()) {
            sheet.style.transform = '';
            if (content) content.style.height = '';
            return;
        }
        const offsets = snapOffsets();
        const offset = offsets[state];
        sheet.style.transform = `translateY(${offset}px)`;
        // Высота видимого контента = видимая часть шторки минус ручка.
        // Так нижние элементы (список точек) доступны прокруткой.
        if (content) {
            const sheetH = window.innerHeight * SHEET_HEIGHT_RATIO;
            const handleH = handle.offsetHeight || 28;
            const visible = Math.max(0, sheetH - offset - handleH);
            content.style.height = `${visible}px`;
        }
    }

    // Циклический переход вверх по тапу на ручку
    function cycleUp() {
        const order = ['collapsed', 'half', 'full'];
        const idx = order.indexOf(state);
        const next = idx < order.length - 1 ? order[idx + 1] : 'collapsed';
        applyState(next);
    }

    // ── Перетаскивание ──
    let dragging = false;
    let startY = 0;
    let startOffset = 0;
    let currentOffset = 0;
    let moved = false;

    function onPointerDown(e) {
        if (!isMobile()) return;
        dragging = true;
        moved = false;
        startY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
        const offsets = snapOffsets();
        startOffset = offsets[state];
        currentOffset = startOffset;
        sheet.classList.add('is-dragging');
        handle.setPointerCapture?.(e.pointerId);
    }

    function onPointerMove(e) {
        if (!dragging) return;
        const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
        const delta = y - startY;
        if (Math.abs(delta) > 4) moved = true;

        const offsets = snapOffsets();
        // ограничиваем в пределах [full, collapsed]
        currentOffset = Math.min(
            offsets.collapsed,
            Math.max(offsets.full, startOffset + delta),
        );
        sheet.style.transform = `translateY(${currentOffset}px)`;
    }

    function onPointerUp() {
        if (!dragging) return;
        dragging = false;
        sheet.classList.remove('is-dragging');

        if (!moved) {
            // Это был тап — циклически раскрываем
            cycleUp();
            return;
        }

        // Снап к ближайшей позиции
        const offsets = snapOffsets();
        const entries = Object.entries(offsets);
        let nearest = entries[0];
        for (const entry of entries) {
            if (Math.abs(entry[1] - currentOffset) < Math.abs(nearest[1] - currentOffset)) {
                nearest = entry;
            }
        }
        applyState(nearest[0]);
    }

    handle.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // Контент не даём скроллить, пока sheet не раскрыт
    content?.addEventListener('touchmove', (e) => {
        if (isMobile() && state === 'collapsed') {
            e.preventDefault();
        }
    }, { passive: false });

    // Пересчёт при ресайзе / повороте
    window.addEventListener('resize', () => applyState(state));

    // Автоматически приподнимаем шторку при важных событиях
    // (например, после построения маршрута пользователь хочет видеть метрики)
    document.addEventListener('sheet:expand-half', () => {
        if (isMobile() && state === 'collapsed') applyState('half');
    });

    // Инициализация
    applyState('collapsed');
}
