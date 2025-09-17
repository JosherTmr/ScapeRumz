/**
 * =ual===========================================================
 * Juego 3: El Mapa del Santuario (Versión 3.1 - Bug de Pistas Corregido)
 * =============================================================
 */
function initMapAdventureGame(roomName, stageName, winToken) {
    // Configuración y referencias al DOM
    const COLS = 38;
    const ROWS = 22;
    const mapEl = document.getElementById('map');
    const posEl = document.getElementById('pos');
    const livesEl = document.getElementById('lives');
    const logEl = document.getElementById('log');
    const codeInput = document.getElementById('code-input');

    // Estado del juego
    let player = { x: 1, y: 1, lives: 3 };
    let map = [];
    const doors = {};
    const traps = {};
    const riddles = {};
    // --- CORRECCIÓN CRÍTICA ---
    // El nombre de la variable ahora es correcto ("foundRiddles" con doble 'd')
    let foundRiddles = new Set();
    // --- FIN DE LA CORRECCIÓN ---

    // Mapa Estático de Excel
    const staticMap = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,4,0,0,5,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,1,4,4,4,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,4,1,1,1,0,1,1,1,1,1,1,4,4,4,1,1,1,1,1,1,4,0,0,0,4,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,4,0,0,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,0,0,0,5,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1],
        [1,1,1,1,0,0,0,0,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1],
        [1,1,1,1,0,3,0,0,2,0,1,1,0,0,0,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1],
        [1,1,1,1,0,0,0,0,1,0,1,1,1,1,0,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,4,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,0,5,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]

    ];

    function createRiddlesUI() {
        if (document.getElementById('riddles-ui')) return;
        const riddlesUI = document.createElement('div');
        riddlesUI.id = 'riddles-ui';
        riddlesUI.innerHTML = '<strong>Pistas Encontradas</strong><div id="riddles-list" style="margin-top:6px; font-size:13px; min-height: 20px; display:flex; flex-direction:column; gap: 4px;"></div>';
        riddlesUI.style.marginTop = '16px';
        logEl.before(riddlesUI);
    }

    function loadStaticMap() {
        map = staticMap;
        player = { x: 2, y: 10, lives: 3 };

        // Pista 1 (en la sala superior derecha) abre la Puerta 1 (central)
        placeRiddle({ x: 32, y: 2 }, {
            question: "Resuelve: 15 * 12 / 3",
            answer: "60"
        });
        placeDoor({ x: 12, y: 13 }, "60");

        // Pista 2 (en la sala inferior derecha) abre la Puerta 2 (hacia la meta)
        placeRiddle({ x: 32, y: 14 }, {
            question: "Binario a decimal: 1101",
            answer: "13"
        });
        placeDoor({ x: 18, y: 18 }, "13");

        // Pista 3 (en la sala inferior central) abre la Puerta 3 (opcional/trampa)
        placeRiddle({ x: 18, y: 20 }, {
            question: "Si f(x)=2x+3, ¿cuánto vale f(7)?",
            answer: "17"
        });
        placeDoor({ x: 8, y: 17 }, "17");

        log('El laberinto te espera. Resuelve los acertijos para encontrar la salida.');
    }

    function coordKey(x, y) { return `${x},${y}`; }
    function placeDoor(tile, code) { if (tile) { doors[coordKey(tile.x, tile.y)] = { code, open: false }; } }
    function placeRiddle(tile, data) { if (tile) { riddles[coordKey(tile.x, tile.y)] = { ...data, found: false }; } }

    function log(text) {
        const p = document.createElement('div');
        p.textContent = `> ${text}`;
        logEl.prepend(p);
    }

    function render() {
        mapEl.innerHTML = '';
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const cell = document.createElement('div');
                cell.classList.add('tile');
                const type = map[y][x];
                const key = coordKey(x, y);

                if (type === 0) cell.classList.add('floor');
                else if (type === 1) cell.classList.add('wall');
                else if (type === 2) { cell.classList.add('door'); if (doors[key] && doors[key].open) cell.classList.add('open'); }
                else if (type === 3) cell.classList.add('goal');
                else if (type === 4) { cell.classList.add('trap'); if (traps[key] && traps[key].triggered) cell.classList.add('revealed'); }
                else if (type === 5) { cell.classList.add('clue'); if (riddles[key] && riddles[key].found) cell.classList.add('triggered'); }

                if (player.x === x && player.y === y) {
                    const pEl = document.createElement('div'); pEl.classList.add('player'); cell.appendChild(pEl);
                }

                if (!isVisible(x, y)) cell.classList.add('hidden');

                mapEl.appendChild(cell);
            }
        }
        posEl.textContent = `${player.x}, ${player.y}`;
        livesEl.textContent = '❤️'.repeat(player.lives > 0 ? player.lives : 0);
        renderRiddlesUI();
    }

    function renderRiddlesUI() {
        const listEl = document.getElementById('riddles-list');
        if (!listEl) return;
        listEl.innerHTML = '';
        foundRiddles.forEach(r => {
            const d = document.createElement('div');
            d.style.background = '#0e1416';
            d.style.padding = '6px 8px';
            d.style.borderRadius = '4px';
            d.textContent = `❓ ${r.question}`;
            listEl.appendChild(d);
        });
    }

    function isVisible(x, y) {
        const dx = Math.abs(player.x - x);
        const dy = Math.abs(player.y - y);
        return (dx * dx + dy * dy) <=4;
    }

    function move(dx, dy) {
        if (player.lives <= 0) return;
        const nx = player.x + dx;
        const ny = player.y + dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return;

        const tile = map[ny][nx];
        const key = coordKey(nx, ny);

        if (tile === 1) { return; }
        if (tile === 2 && doors[key] && !doors[key].open) { log(`La puerta está cerrada.`); return; }

        player.x = nx;
        player.y = ny;

        if (tile === 3) {
            log('¡Encontraste la meta! ¡Has escapado!');
            setTimeout(() => submitWin(roomName, stageName, winToken), 1000);
        } else if (tile === 4) {
            const trapKey = key;
            if (!traps[trapKey] || !traps[trapKey].triggered) {
                traps[trapKey] = { triggered: true };
                player.lives--;
                log('¡Caíste en una trampa! Pierdes una vida.');
                document.body.classList.add('shake-animation');
                setTimeout(() => document.body.classList.remove('shake-animation'), 500);
                if (player.lives <= 0) {
                    log('Te has quedado sin vidas.');
                    setTimeout(() => failGame("Has sucumbido a las trampas del laberinto.", roomName), 1500);
                }
            }
        } else if (tile === 5 && riddles[key] && !riddles[key].found) {
            const riddle = riddles[key];
            riddle.found = true;
            foundRiddles.add(riddle);
            log(`Hallaste una nota: "${riddle.question}"`);
        }
        render();
    }

    function tryCode(value) {
        const adj = [[player.x + 1, player.y], [player.x - 1, player.y], [player.x, player.y + 1], [player.x, player.y - 1]];
        let opened = false;
        adj.forEach(([x, y]) => {
            const key = coordKey(x, y);
            const door = doors[key];
            if (door && !door.open && value.trim().toLowerCase() === door.code.toLowerCase()) {
                door.open = true;
                opened = true;
                log(`La puerta (${door.code}) se abre.`);
            }
        });

        if (!opened) { log('El código no funciona aquí.'); }
        render();
    }

    window.addEventListener('keydown', (e) => {
        if (document.activeElement === codeInput) return;
        if (e.key === 'ArrowUp') { move(0, -1); e.preventDefault(); }
        if (e.key === 'ArrowDown') { move(0, 1); e.preventDefault(); }
        if (e.key === 'ArrowLeft') { move(-1, 0); e.preventDefault(); }
        if (e.key === 'ArrowRight') { move(1, 0); e.preventDefault(); }
    });
    document.getElementById('btn-up').addEventListener('click', () => move(0, -1));
    document.getElementById('btn-down').addEventListener('click', () => move(0, 1));
    document.getElementById('btn-left').addEventListener('click', () => move(-1, 0));
    document.getElementById('btn-right').addEventListener('click', () => move(1, 0));
    document.getElementById('try-code').addEventListener('click', () => {
        const value = codeInput.value.trim();
        if (!value) return;
        tryCode(value);
        codeInput.value = '';
    });
    codeInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('try-code').click();
        }
    });

    createRiddlesUI();
    loadStaticMap();
    render();
}
