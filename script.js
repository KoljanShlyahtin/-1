// script.js
document.addEventListener('DOMContentLoaded', function() {
    const devices = document.querySelectorAll('.interactive');
    const errorTooltip = document.getElementById('tooltip');
    const infoTooltip = document.getElementById('info-tooltip');
    const modeBtn = document.getElementById('btn-mode');
    const STORAGE_KEY = 'schema_state_v1';

    let isEditMode = true;
    let tooltipTimeout; // Переменная для таймера исчезновения

    // === НАСТРОЙКА ЗВУКОВ ===
    const sounds = {
        click: new Audio("Footstep_Dirt_3.ogg.mp3"),
        error: new Audio("Landing.wav.mp3")
    };

    Object.values(sounds).forEach(s => {
        s.volume = 0.4; 
        s.load();
    });

    function playSound(name) {
        if (sounds[name]) {
            sounds[name].cloneNode(true).play().catch(() => {});
        }
    }
    // === КОНЕЦ НАСТРОЙКИ ЗВУКОВ ===

    // 1. ЗАГРУЗКА СОСТОЯНИЯ
    function loadState() {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            try {
                const stateObj = JSON.parse(savedState);
                for (const [id, isActive] of Object.entries(stateObj)) {
                    if (isActive) {
                        const el = document.getElementById(id);
                        if (el) el.classList.add('active');
                    }
                }
            } catch (e) { console.error("Ошибка загрузки состояния", e); }
        }
    }

    // 2. СОХРАНЕНИЕ
    function saveState() {
        const stateObj = {};
        devices.forEach(el => {
            stateObj[el.id] = el.classList.contains('active');
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateObj));
    }

    // 3. БЛОКИРОВКИ
    function updateLocks() {
        document.querySelectorAll('.locked').forEach(el => el.classList.remove('locked'));
        devices.forEach(el => {
            if (el.classList.contains('active')) {
                const pairId = el.getAttribute('data-pair');
                if (pairId) {
                    const pairEl = document.getElementById(pairId);
                    if (pairEl) pairEl.classList.add('locked');
                }
            }
        });
    }

    // 4. ТЕКСТ ПОДСКАЗКИ
    function getInfoText(el) {
        const name = el.getAttribute('data-name') || el.id.toUpperCase();
        const isLocked = el.classList.contains('locked');
        const isActive = el.classList.contains('active');

        let statusHtml = '';
        if (isLocked) statusHtml = '<span class="status-locked">ЗАБЛОКИРОВАНО</span>';
        else if (isActive) statusHtml = '<span class="status-on">ВКЛЮЧЕНО</span>';
        else statusHtml = '<span class="status-off">ОТКЛЮЧЕНО</span>';

        return `<span class="info-title">${name}</span><span class="info-status">Статус: ${statusHtml}</span>`;
    }

    // Функция показа подсказки с авто-скрытием
    function showInfoTooltip(el, x, y) {
        // Сбрасываем предыдущий таймер скрытия
        clearTimeout(tooltipTimeout);

        infoTooltip.innerHTML = getInfoText(el);
        infoTooltip.style.left = x + 'px';
        infoTooltip.style.top = (y - 10) + 'px';
        infoTooltip.style.opacity = '1';

        // Устанавливаем новый таймер: скрыть через 1500 мс (1.5 сек)
        tooltipTimeout = setTimeout(() => {
            infoTooltip.style.opacity = '0';
        }, 1500);
    }

    // ОБРАБОТЧИКИ СОБЫТИЙ
    devices.forEach(function(el) {
        el.addEventListener('click', function(e) {
            if (!isEditMode) return;
            e.stopPropagation();

            if (this.classList.contains('locked')) {
                showTooltip(e.clientX, e.clientY, "Недоступно: включена смежная цепь");
                playSound('error');
                return;
            }

            this.classList.toggle('active');
            playSound('click');
            saveState();
            updateLocks();
            
            // Показываем обновленную подсказку сразу после клика
            showInfoTooltip(this, e.clientX, e.clientY);
        });

        el.addEventListener('mouseenter', function(e) {
            showInfoTooltip(this, e.clientX, e.clientY);
        });

        el.addEventListener('mousemove', function(e) {
            // Если подсказка видна, двигаем её за мышью и сбрасываем таймер исчезновения
            if (infoTooltip.style.opacity === '1') {
                infoTooltip.style.left = e.clientX + 'px';
                infoTooltip.style.top = (e.clientY - 10) + 'px';
                
                // Сбрасываем таймер, чтобы она не исчезла пока мы двигаем мышью
                clearTimeout(tooltipTimeout);
                tooltipTimeout = setTimeout(() => {
                    infoTooltip.style.opacity = '0';
                }, 1500);
            }
        });

        el.addEventListener('mouseleave', () => {
            // При уходе мыши скрываем немедленно
            clearTimeout(tooltipTimeout);
            infoTooltip.style.opacity = '0';
        });
    });

    function showTooltip(x, y, text) {
        errorTooltip.textContent = text;
        errorTooltip.style.left = x + 'px';
        errorTooltip.style.top = y + 'px';
        errorTooltip.style.opacity = '1';
        setTimeout(() => { errorTooltip.style.opacity = '0'; }, 1500);
    }

    // Переключение режима
    if (modeBtn) {
        modeBtn.addEventListener('click', () => {
            isEditMode = !isEditMode;
            modeBtn.textContent = isEditMode ? "Режим: Редактирование" : "Режим: Просмотр";
            modeBtn.classList.toggle('active-mode', isEditMode);
        });
    }

    // Глобальная функция сброса
    window.resetSchema = function() {
        if(confirm('Сбросить все состояния схемы?')) {
            localStorage.removeItem('schema_state_v1');
            location.reload();
        }
    };

    // Запуск
    loadState();
    updateLocks();
});

