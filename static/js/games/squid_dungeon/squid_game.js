/**
 * =============================================================
 * Squid Game - Themed Dungeon
 * =============================================================
 */
async function initSquidGame(roomName, stageName, winToken) {
    // --- DOM References ---
    const mapEl = document.getElementById('map');
    const posEl = document.getElementById('pos');
    const livesEl = document.getElementById('lives');
    const logEl = document.getElementById('log');
    const collectedNumbersListEl = document.getElementById('collected-numbers-list');
    const mapWrap = document.getElementById('map-wrap');

    // Modals
    const marblesModal = document.getElementById('marbles-modal-overlay');
    const dalgonaModal = document.getElementById('dalgona-modal-overlay');

    // Marble Modal Elements
    const marblesParBtn = document.getElementById('marbles-par-btn');
    const marblesImparBtn = document.getElementById('marbles-impar-btn');
    const marblesResultEl = document.getElementById('marbles-result');

    // Dalgona Modal Elements
    const dalgonaSubmitBtn = document.getElementById('dalgona-submit-btn');
    const dalgonaInput = document.getElementById('dalgona-input');

    // --- Visual Config ---
    const COLS = 38, ROWS = 22;
    const IMAGE_PATH = '/static/img';

    // --- Game State ---
    let gameState = {};
    let statePollInterval;
    let activeModal = null; // 'marbles' or 'dalgona'

    // --- Helper Functions ---
    function coordKey(x, y) { return `${x},${y}`; }

    function log(text) {
        if (!text) return;
        logEl.innerHTML = `<div>&gt; ${text}</div>` + logEl.innerHTML;
    }

    // --- Core Game Logic ---
    async function startGame() {
        try {
            const response = await fetch('/api/squid/start', { method: 'POST' });
            if (!response.ok) throw new Error('Failed to start game');
            gameState = await response.json();
            log('Bienvenido al juego. Supera las 4 salas para sobrevivir.');
            render();
            statePollInterval = setInterval(pollState, 500);
        } catch (error) {
            console.error("Error starting game:", error);
            log("Error fatal al iniciar la partida.");
        }
    }

    async function pollState() {
        if (activeModal) return; // Don't poll when a modal is active
        try {
            const response = await fetch('/api/squid/get_state');
            if (!response.ok) throw new Error('Failed to get state');
            gameState = await response.json();
            render(); // Re-render to show light changes
        } catch (error) {
            console.error("Error polling state:", error);
        }
    }

    function render() {
        if (!gameState.map) return;

        const { map, player, game_state, collected_numbers } = gameState;

        // Render map
        mapEl.innerHTML = '';
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const cell = document.createElement('div');
                cell.classList.add('tile');
                const texture = document.createElement('div');
                texture.classList.add('tile-texture');
                const type = map[y][x];

                // Tile type mapping
                if (type === 0) texture.classList.add('floor');
                else if (type === 1) texture.classList.add('wall');
                else if (type === 2) texture.classList.add('door');
                else if (type === 3) texture.classList.add('goal');
                else if (type === 5) texture.classList.add('clue'); // Room goal
                else if (type === 6) texture.classList.add('trap'); // Special tile

                cell.appendChild(texture);

                if (player.x === x && player.y === y) {
                    const playerEl = document.createElement('div');
                    playerEl.className = 'player';
                    cell.appendChild(playerEl);
                }
                mapEl.appendChild(cell);
            }
        }

        // Update UI Panel
        posEl.textContent = `${player.x}, ${player.y}`;
        livesEl.textContent = '❤️'.repeat(player.lives > 0 ? player.lives : 0);

        // Update collected numbers
        collectedNumbersListEl.innerHTML = '';
        if (collected_numbers && collected_numbers.length > 0) {
            collected_numbers.forEach(num => {
                const d = document.createElement('div');
                d.className = 'number-item';
                d.textContent = num;
                collectedNumbersListEl.appendChild(d);
            });
        } else {
            collectedNumbersListEl.textContent = 'Ninguno';
        }

        // Handle Red Light effect
        if (game_state.red_light_active) {
            mapWrap.classList.add('red-light');
        } else {
            mapWrap.classList.remove('red-light');
        }
    }

    async function move(dx, dy) {
        if (gameState.game_over || activeModal) return;

        const response = await fetch('/api/squid/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dx, dy })
        });
        gameState = await response.json();

        log(gameState.log_message);
        render();

        // Check for minigame triggers
        const currentRoom = gameState.game_state.active_room;
        if (currentRoom === 'sala2' && !activeModal) {
            showMarblesModal();
        } else if (currentRoom === 'sala4' && !activeModal) {
            showDalgonaModal();
        }

        if (gameState.game_over) {
            endGame(gameState.win);
        }
    }

    // --- Modal Logic ---
    function showMarblesModal() {
        activeModal = 'marbles';
        marblesResultEl.textContent = '';
        marblesModal.style.display = 'flex';
    }

    async function playMarbles(choice) {
        const response = await fetch('/api/squid/play_marbles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ choice })
        });
        const result = await response.json();

        if (result.win) {
            marblesResultEl.textContent = `¡Ganaste! El número era ${result.number}.`;
            log("Has ganado el juego de canicas. Puedes proceder.");
            setTimeout(() => {
                marblesModal.style.display = 'none';
                activeModal = null;
            }, 2000);
        } else {
            marblesResultEl.textContent = `Perdiste. El número era ${result.number}. Inténtalo de nuevo.`;
        }
    }

    function showDalgonaModal() {
        activeModal = 'dalgona';
        dalgonaInput.value = '';
        dalgonaModal.style.display = 'flex';
    }

    async function solveDalgona() {
        const sequenceStr = dalgonaInput.value.split(',').map(s => s.trim());
        const sequence = sequenceStr.map(n => parseInt(n, 10)).filter(n => !isNaN(n));

        if (sequence.length !== 9) {
            log("Secuencia inválida. Debe contener 9 números separados por comas.");
            return;
        }

        const response = await fetch('/api/squid/solve_dalgona', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sequence })
        });
        const result = await response.json();

        if (result.win) {
            log("¡Secuencia correcta! Has ganado el juego.");
            // The backend will set game_over and win, which will be handled in the move loop
            dalgonaModal.style.display = 'none';
            activeModal = null;
        } else {
            log("Secuencia incorrecta. La IA ha detectado un error. Pierdes una vida.");
            gameState.player.lives -= 1; // Manually decrement on frontend for immediate feedback
            render();
            dalgonaModal.style.display = 'none';
            activeModal = null;
            if (gameState.player.lives <= 0) {
                endGame(false);
            }
        }
    }


    function endGame(didWin) {
        if (statePollInterval) clearInterval(statePollInterval);

        document.querySelectorAll('.btn').forEach(b => b.disabled = true);
        window.onkeydown = null;

        if (didWin) {
            setTimeout(() => submitWin(roomName, stageName, winToken), 1500);
        } else {
            failGame("Has sido eliminado del juego.", roomName);
        }
    }

    // --- Event Listeners ---
    document.getElementById('btn-up').addEventListener('click', () => move(0, -1));
    document.getElementById('btn-down').addEventListener('click', () => move(0, 1));
    document.getElementById('btn-left').addEventListener('click', () => move(-1, 0));
    document.getElementById('btn-right').addEventListener('click', () => move(1, 0));

    window.onkeydown = (e) => {
        if (activeModal) return;
        const keyMap = { 'ArrowUp': [0, -1], 'ArrowDown': [0, 1], 'ArrowLeft': [-1, 0], 'ArrowRight': [1, 0] };
        if (keyMap[e.key]) {
            e.preventDefault();
            move(...keyMap[e.key]);
        }
    };

    marblesParBtn.addEventListener('click', () => playMarbles('par'));
    marblesImparBtn.addEventListener('click', () => playMarbles('impar'));
    dalgonaSubmitBtn.addEventListener('click', solveDalgona);

    // --- Start Game ---
    startGame();
}
