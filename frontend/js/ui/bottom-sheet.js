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

// Реально видимая высота вьюпорта. visualViewport корректно учитывает динамические
// панели браузера на всех современных движках (WebKit/Blink/Gecko); innerHeight — фолбэк.
function viewportH() {
    return window.visualViewport?.height ?? window.innerHeight;
}

// Фактическая высота шторки берётся из DOM (что реально отрендерил браузер по 88dvh/88vh),
// чтобы расчёты в JS не расходились с CSS-единицами. Фолбэк — vh-математика.
function sheetHeight(sheet) {
    const measured = sheet?.getBoundingClientRect().height || 0;
    return measured || viewportH() * SHEET_HEIGHT_RATIO;
}

function snapOffsets(sheet) {
    const vh = viewportH();
    const sheetH = sheetHeight(sheet);
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
        const offsets = snapOffsets(sheet);
        const offset = offsets[state];
        sheet.style.transform = `translateY(${offset}px)`;
        // Высота видимого контента считается так, чтобы её низ совпал с низом видимой
        // области экрана (над панелью браузера). Всё в измеренных пикселях — без vh-догадок.
        if (content) {
            const vh = viewportH();
            const sheetH = sheetHeight(sheet);
            const handleH = handle.offsetHeight || 28;
            // Целевое положение верха шторки в координатах видимой области.
            const sheetTop = vh - sheetH + offset;
            const visible = Math.max(0, vh - sheetTop - handleH);
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
        const offsets = snapOffsets(sheet);
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

        const offsets = snapOffsets(sheet);
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
        const offsets = snapOffsets(sheet);
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

    // Пересчёт при любом изменении видимой области.
    const recalc = () => applyState(state);
    window.addEventListener('resize', recalc);            // ресайз / поворот
    window.addEventListener('orientationchange', recalc); // поворот (старые браузеры)
    // Показ/скрытие динамических панелей браузера: iOS Safari (resize),
    // Android Chrome двигает visualViewport при сворачивании URL-бара (scroll).
    window.visualViewport?.addEventListener('resize', recalc);
    window.visualViewport?.addEventListener('scroll', recalc);

    // Автоматически приподнимаем шторку при важных событиях
    // (например, после построения маршрута пользователь хочет видеть метрики)
    document.addEventListener('sheet:expand-half', () => {
        if (isMobile() && state === 'collapsed') applyState('half');
    });

    // Инициализация. Повторяем в rAF: на первом кадре мобильные браузеры часто ещё
    // не устаканили геометрию вьюпорта, и измерение шторки было бы неточным.
    applyState('collapsed');
    requestAnimationFrame(() => applyState(state));
}
