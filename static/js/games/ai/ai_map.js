/**
 * =============================================================
 * Juego 4 (Sala AI): Laberinto del Búnker (Apocalipsis Estático)
 * =============================================================
 *
 * NOTA DE MANTENIBILIDAD:
 * Gran parte de la lógica de este juego (el mapa, la ubicación de los puzzles, etc.)
 * está hardcodeada en este archivo. Para una mayor flexibilidad y seguridad,
 * considera cargar esta configuración desde el backend en el futuro.
 */
async function initStaticApocalypseMap(roomName, stageName, winToken) {
    // --- Referencias al DOM ---
    const mapEl = document.getElementById('map');
    const posEl = document.getElementById('pos');
    const livesEl = document.getElementById('lives');
    const logEl = document.getElementById('log');
    const keysListEl = document.getElementById('keys-list');
    const modalOverlay = document.getElementById('captcha-modal-overlay');
    const captchaPrompt = document.getElementById('captcha-prompt');
    const captchaGrid = document.getElementById('captcha-grid');
    const captchaSubmit = document.getElementById('captcha-submit');

    // --- Configuración Visual ---
    const COLS = 38, ROWS = 22;
    const IMAGE_PATH = '/static/img';

    // --- Estado del Juego (ahora mínimo en el cliente) ---
    let gameState = {}; // Contendrá toda la data del servidor
    let currentPuzzleKey = null;
    let selectedCaptchaIndices = [];
    let trapIntervalId;

    // --- FUNCIONES AUXILIARES ---
    function coordKey(x, y) { return `${x},${y}`; }

    function log(text) {
        if (!text) return;
        logEl.innerHTML = `<div>&gt; ${text}</div>` + logEl.innerHTML;
    }

    // --- LÓGICA DE JUEGO (API-Driven) ---
    async function startGame() {
        try {
            const response = await fetch('/api/ai/map/start', { method: 'POST' });
            if (!response.ok) throw new Error('Failed to start game');
            gameState = await response.json();
            log('Sistema: Sobreviviente detectado. Accede al búnker de seguridad.');
            render();
            startTrapCycle(gameState.start_time); // Pasar la hora del servidor
        } catch (error) {
            console.error("Error starting game:", error);
            log("Error fatal al iniciar la partida.");
        }
    }

    const TRAP_INTERVAL = 4000; // El ciclo completo es de 4 segundos
    let visualTraps = {}; // For visual state only

    function startTrapCycle(serverStartTime) {
        const clientStartTime = Date.now();
        const serverTimeOffset = (serverStartTime * 1000) - clientStartTime;

        trapIntervalId = setInterval(() => {
            const correctedTime = Date.now() + serverTimeOffset;
            const timeSinceStart = correctedTime - (serverStartTime * 1000);

            if (gameState.map && gameState.trap_offsets) {
                gameState.map.forEach((row, y) => {
                    row.forEach((tileType, x) => {
                        if (tileType === 4) {
                            const key = coordKey(x, y);
                            const offset = (gameState.trap_offsets[key] || 0) * 1000;
                            const isTrapActive = ((timeSinceStart + offset) % TRAP_INTERVAL) < (TRAP_INTERVAL / 2);
                            visualTraps[key] = isTrapActive;
                        }
                    });
                });
            }
            render();
        }, 500);
    }

    function render() {
        if (!gameState.map) return; // Don't render if no state

        mapEl.innerHTML = '';
        const { map, player, doors, traps, unlocked_keys, puzzles } = gameState;

        const isVisible = (x, y) => {
            const dx = Math.abs(player.x - x);
            const dy = Math.abs(player.y - y);
            return (dx * dx + dy * dy) <= 12;
        };

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const cell = document.createElement('div');
                cell.classList.add('tile');
                const texture = document.createElement('div');
                texture.classList.add('tile-texture');
                const type = map[y][x];
                const key = coordKey(x, y);

                if (type === 0) texture.classList.add('floor');
                else if (type === 1) texture.classList.add('wall');
                else if (type === 2) { texture.classList.add('door'); if (doors[key] && doors[key].open) texture.classList.add('open'); }
                else if (type === 3) texture.classList.add('goal');
                else if (type === 4) {
                    texture.classList.add('trap');
                    if (visualTraps[key]) texture.classList.add('revealed');
                }
                else if (type === 5) {
                    texture.classList.add('clue');
                    if (puzzles[key] && puzzles[key].solved) texture.classList.add('triggered');
                }
                cell.appendChild(texture);

                if (player.x === x && player.y === y) {
                    const playerEl = document.createElement('div');
                    playerEl.className = 'player';
                    cell.appendChild(playerEl);
                }
                if (!isVisible(x, y)) {
                    cell.classList.add('hidden');
                }
                mapEl.appendChild(cell);
            }
        }
        posEl.textContent = `${player.x}, ${player.y}`;
        livesEl.textContent = '❤️'.repeat(player.lives > 0 ? player.lives : 0);

        keysListEl.innerHTML = '';
        if (!unlocked_keys || unlocked_keys.length === 0) {
            keysListEl.innerHTML = '<div>Ninguna...</div>';
        } else {
            unlocked_keys.forEach(keyName => {
                const d = document.createElement('div');
                d.className = 'key-item';
                d.textContent = `🔑 Llave de Acceso ${keyName}`;
                keysListEl.appendChild(d);
            });
        }
    }

    async function move(dx, dy) {
        if (gameState.game_over || modalOverlay.style.display === 'flex') return;

        const response = await fetch('/api/ai/map/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dx, dy })
        });
        gameState = await response.json();

        log(gameState.log_message);

        // Handle visual effects sent from the backend
        if (gameState.effects && gameState.effects.includes('shake')) {
            const gameContainer = document.querySelector('.game-wrap');
            gameContainer.classList.add('shake-animation');
            gameContainer.addEventListener('animationend', () => {
                gameContainer.classList.remove('shake-animation');
            }, { once: true });
        }

        render();

        // Check for interactions on the new tile
        const playerPosKey = coordKey(gameState.player.x, gameState.player.y);
        const puzzle = gameState.puzzles[playerPosKey];
        if (puzzle && !puzzle.solved) {
            showCaptchaModal(puzzle, playerPosKey);
        }

        if (gameState.game_over) {
            endGame(gameState.win);
        }
    }

    function showCaptchaModal(puzzleData, puzzleKey) {
        currentPuzzleKey = puzzleKey;
        selectedCaptchaIndices = [];
        captchaPrompt.textContent = puzzleData.puzzle.prompt;
        captchaGrid.innerHTML = '';
        puzzleData.puzzle.images.forEach((imgFile, index) => {
            const img = document.createElement('img');
            img.src = IMAGE_PATH + imgFile;
            img.classList.add('captcha-image');
            img.dataset.index = index;
            img.onclick = () => {
                img.classList.toggle('selected');
                const idx = selectedCaptchaIndices.indexOf(index);
                if (idx > -1) selectedCaptchaIndices.splice(idx, 1);
                else selectedCaptchaIndices.push(index);
            };
            captchaGrid.appendChild(img);
        });
        modalOverlay.style.display = 'flex';
    }

    async function handleCaptchaSubmit() {
        const response = await fetch('/api/ai/map/solve_puzzle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                puzzle_key: currentPuzzleKey,
                selected_indices: selectedCaptchaIndices
            })
        });
        gameState = await response.json();

        log(gameState.log_message);
        modalOverlay.style.display = 'none';
        render();

        if (gameState.game_over) {
            endGame(gameState.win);
        }
    }

    function endGame(didWin) {
        if (trapIntervalId) clearInterval(trapIntervalId);

        // Disable controls
        document.querySelectorAll('.btn').forEach(b => b.disabled = true);
        window.onkeydown = null;

        if (didWin) {
            setTimeout(() => submitWin(roomName, stageName, winToken), 1500);
        } else {
            failGame("La IA te ha considerado una amenaza y te ha eliminado.", roomName);
        }
    }

    // --- Event Listeners ---
    document.getElementById('btn-up').addEventListener('click', () => move(0, -1));
    document.getElementById('btn-down').addEventListener('click', () => move(0, 1));
    document.getElementById('btn-left').addEventListener('click', () => move(-1, 0));
    document.getElementById('btn-right').addEventListener('click', () => move(1, 0));
    captchaSubmit.addEventListener('click', handleCaptchaSubmit);

    window.onkeydown = (e) => {
        if (modalOverlay.style.display === 'flex') return;
        const keyMap = { 'ArrowUp': [0, -1], 'ArrowDown': [0, 1], 'ArrowLeft': [-1, 0], 'ArrowRight': [1, 0] };
        if (keyMap[e.key]) {
            e.preventDefault();
            move(...keyMap[e.key]);
        }
    };

    // --- Iniciar Juego ---
    startGame();
}
