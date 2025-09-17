/**
 * =============================================================
 * Juego 3: El Mapa del Santuario (Backend-Driven)
 * =============================================================
 */
async function initMapAdventureGame(roomName, stageName, winToken) {
    // --- Referencias al DOM ---
    const mapEl = document.getElementById('map');
    const posEl = document.getElementById('pos');
    const livesEl = document.getElementById('lives');
    const logEl = document.getElementById('log');
    const codeInput = document.getElementById('code-input');
    const tryCodeBtn = document.getElementById('try-code');

    // --- Configuración Visual ---
    const COLS = 38;
    const ROWS = 22;

    // --- Estado del Juego (mínimo en el cliente) ---
    let gameState = {};

    // --- Funciones Auxiliares ---
    function log(text) {
        if (!text) return;
        const p = document.createElement('div');
        p.textContent = `> ${text}`;
        logEl.prepend(p);
    }

    function render() {
        if (!gameState.map) return;

        mapEl.innerHTML = '';
        const { map, player, doors, found_riddles } = gameState;

        const isVisible = (x, y) => {
            const dx = Math.abs(player.x - x);
            const dy = Math.abs(player.y - y);
            return (dx * dx + dy * dy) <= 16; // Aumentar un poco el radio de visión
        };

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const cell = document.createElement('div');
                cell.classList.add('tile');
                const type = map[y][x];
                const key = `${x},${y}`;

                if (type === 0) cell.classList.add('floor');
                else if (type === 1) cell.classList.add('wall');
                else if (type === 2) { cell.classList.add('door'); if (doors[key] && doors[key].open) cell.classList.add('open'); }
                else if (type === 3) cell.classList.add('goal');
                else if (type === 4) cell.classList.add('trap'); // El estado revelado se manejará por separado si es necesario
                else if (type === 5) {
                    cell.classList.add('clue');
                    if (found_riddles[key]) cell.classList.add('triggered');
                }

                if (player.x === x && player.y === y) {
                    const pEl = document.createElement('div'); pEl.classList.add('player'); cell.appendChild(pEl);
                }

                if (!isVisible(x, y)) cell.classList.add('hidden');

                mapEl.appendChild(cell);
            }
        }

        posEl.textContent = `${player.x}, ${player.y}`;
        livesEl.textContent = '❤️'.repeat(player.lives > 0 ? player.lives : 0);

        const riddlesUI = document.getElementById('riddles-ui');
        if (riddlesUI) {
            const listEl = document.getElementById('riddles-list');
            listEl.innerHTML = '';
            for (const key in found_riddles) {
                const d = document.createElement('div');
                d.style.background = '#0e1416';
                d.style.padding = '6px 8px';
                d.style.borderRadius = '4px';
                d.textContent = `❓ ${found_riddles[key].question}`;
                listEl.appendChild(d);
            }
        }
    }

    async function handleApiResponse(response) {
        if (!response.ok) {
            console.error("API request failed:", response);
            log("Error de conexión con el servidor.");
            return;
        }
        gameState = await response.json();

        log(gameState.log_message);

        if (gameState.effects && gameState.effects.includes('shake')) {
            document.body.classList.add('shake-animation');
            document.body.addEventListener('animationend', () => {
                document.body.classList.remove('shake-animation');
            }, { once: true });
        }

        render();

        if (gameState.game_over) {
            endGame(gameState.win);
        }
    }

    async function move(dx, dy) {
        if (gameState.game_over) return;
        const response = await fetch('/api/minecraft/map/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dx, dy })
        });
        await handleApiResponse(response);
    }

    async function tryCode() {
        const code = codeInput.value.trim();
        if (!code || gameState.game_over) return;

        const response = await fetch('/api/minecraft/map/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code })
        });
        codeInput.value = '';
        await handleApiResponse(response);
    }

    function endGame(didWin) {
        document.querySelectorAll('.btn').forEach(b => b.disabled = true);
        window.onkeydown = null;
        if (didWin) {
            setTimeout(() => submitWin(roomName, stageName, winToken), 1500);
        } else {
            setTimeout(() => failGame("Has sucumbido a las trampas del laberinto.", roomName), 1500);
        }
    }

    // --- Inicialización ---
    try {
        const response = await fetch('/api/minecraft/map/start', { method: 'POST' });
        await handleApiResponse(response);
    } catch (error) {
        console.error("Error starting game:", error);
        log("Error fatal al iniciar la partida.");
    }

    // --- Event Listeners ---
    document.getElementById('btn-up').addEventListener('click', () => move(0, -1));
    document.getElementById('btn-down').addEventListener('click', () => move(0, 1));
    document.getElementById('btn-left').addEventListener('click', () => move(-1, 0));
    document.getElementById('btn-right').addEventListener('click', () => move(1, 0));
    tryCodeBtn.addEventListener('click', tryCode);
    codeInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') tryCode(); });

    window.onkeydown = (e) => {
        if (document.activeElement === codeInput) return;
        const keyMap = { 'ArrowUp': [0, -1], 'ArrowDown': [0, 1], 'ArrowLeft': [-1, 0], 'ArrowRight': [1, 0] };
        if (keyMap[e.key]) {
            e.preventDefault();
            move(...keyMap[e.key]);
        }
    };

    // Crear el contenedor de pistas si no existe
    if (!document.getElementById('riddles-ui')) {
        const riddlesUI = document.createElement('div');
        riddlesUI.id = 'riddles-ui';
        riddlesUI.innerHTML = '<strong>Pistas Encontradas</strong><div id="riddles-list" style="margin-top:6px; font-size:13px; min-height: 20px; display:flex; flex-direction:column; gap: 4px;"></div>';
        riddlesUI.style.marginTop = '16px';
        logEl.before(riddlesUI);
    }
}
