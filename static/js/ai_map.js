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
function initStaticApocalypseMap(roomName, stageName, winToken) {
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

    // --- Configuración ---
    const COLS = 38, ROWS = 22;
    const IMAGE_PATH = '/static/img';
    const puzzleBank = [

        { type: 'belongs-or-no', prompt: "Sistema: Selecciona la(s) imagen(es) que no pertenece(n) al grupo", images: ['/captcha_ai/gomitas1.jpg','/captcha_ai/gomitas2.jpg','/captcha_ai/gomitas3.jpg','/captcha_ai/gomitas4.jpg','/captcha_ai/gomitas5.jpg','/captcha_ai/gomitas6.jpg','/captcha_ai/gomitas7.jpg','/captcha_ai/gomitas8.jpg','/captcha_ai/gomitas9.jpg'], correctIndices: [8] },
        { type: 'belongs-or-no2', prompt: "Sistema: Selecciona la(s) imagen(es) que no pertenece(n) al grupo.", images: ['/captcha_ai/limas.jpg','/captcha_ai/lime.jpg','/captcha_ai/limones.jpg','/captcha_ai/mandarinas.jpg','/captcha_ai/manodebuda.jpg','/captcha_ai/maracuya.jpg','/captcha_ai/naranjas.jpg','/captcha_ai/papaya.jpg','/captcha_ai/pomelos.jpg'], correctIndices: [5,7] },
        { type: 'belongs-or-no3', prompt: "Sistema: Selecciona la(s) imagen(es) que no pertenece(n) al grupo.", images: ['/captcha_ai/cupcake5.jpg','/captcha_ai/cupcake4.jpg','/captcha_ai/cupcake2.jpg','/captcha_ai/cupcake9.jpg','/captcha_ai/cupcake8.jpg','/captcha_ai/cupcake7.jpg','/captcha_ai/cupcake1.jpg','/captcha_ai/cupcake6.jpg','/captcha_ai/cupcake3.jpg'], correctIndices: [3,4] },
        { type: 'belongs-or-no4', prompt: "Sistema: Elige solo los numeros primos", images: ['/captcha_ai/numeros2.jpg','/captcha_ai/numeros9.jpg','/captcha_ai/numeros7.png','/captcha_ai/numeros5.jpg','/captcha_ai/numeros1.jpg','/captcha_ai/numeros8.png','/captcha_ai/numeros6.jpg','/captcha_ai/numeros4.jpg','/captcha_ai/numeros3.jpg'], correctIndices: [0,4,7,8] }

    ];

    // --- Estado del Juego ---
    let player, map, doors, puzzles, traps, currentCaptcha, selectedCaptchaIndices, trapIntervalId;
    const unlockedKeys = new Set();
    const staticMap = [ [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
    [1,1,1,0,0,5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
    [1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
    [1,0,1,4,0,0,1,1,1,1,5,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
    [1,0,1,1,1,0,1,1,1,1,0,0,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
    [1,0,0,0,0,0,1,1,4,1,1,1,0,0,0,1,4,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
    [1,4,0,1,0,0,2,0,0,0,0,0,0,1,0,0,0,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
    [1,1,1,1,4,0,1,1,0,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
    [1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,4,0,0,0,4,1,1,1,1,1,1,1,4,4,1,1,1,1,],
    [1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,4,0,1,1,1,0,0,0,0,0,1,1,1,1,1,1,4,0,0,4,4,1,1,],
    [1,1,1,1,1,1,1,0,0,0,1,1,1,1,0,0,0,1,1,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,4,1,1,],
    [1,1,1,4,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,5,0,4,1,1,],
    [1,1,1,0,0,4,1,0,0,0,1,1,1,1,0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,1,1,4,0,0,4,4,1,1,],
    [1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,4,0,0,0,4,1,1,1,1,1,1,1,4,4,1,1,1,1,],
    [1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
    [1,1,1,1,4,0,0,1,0,0,0,4,1,1,1,0,1,1,1,1,1,0,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
    [1,1,1,1,4,5,0,2,0,0,0,0,1,1,1,0,1,1,1,1,1,0,1,1,1,3,0,1,1,1,1,1,1,1,1,1,1,1,],
    [1,1,1,1,4,0,0,1,0,0,0,0,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,],
    [1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,],
    [1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,4,0,0,2,0,0,1,1,1,1,1,1,1,1,1,1,1,],
    [1,1,1,1,1,1,1,1,0,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,4,1,1,1,1,1,1,1,1,1,1,1,],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,]
    ];

    // --- FUNCIONES AUXILIARES ---
    function coordKey(x, y) { return `${x},${y}`; }
    function log(text) { logEl.innerHTML = `<div>&gt; ${text}</div>` + logEl.innerHTML; }
    function isVisible(x, y) {
        const dx = Math.abs(player.x - x);
        const dy = Math.abs(player.y - y);
        return (dx * dx + dy * dy) <= 12;
    }

    // --- LÓGICA DEL JUEGO ---
    function getRandomPuzzle() {
        const randomIndex = Math.floor(Math.random() * puzzleBank.length);
        return puzzleBank[randomIndex];
    }

    function setupLevel() {
        if (puzzleBank.length < 3) { console.error("Error: puzzleBank necesita al menos 3 puzzles."); return; }
        map = staticMap;
        player = { x: 1, y: 2, lives: 4 };
        doors = {};
        puzzles = {};

        // --- MODIFICADO: Ahora `traps` guarda el estado (activo/inactivo) de cada trampa. ---
        traps = {};
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (map[y][x] === 4) { // Si la celda es una trampa (tipo 4)
                    traps[coordKey(x, y)] = { active: false }; // La añadimos al registro, inicialmente inactiva.
                }
            }
        }

        puzzles[coordKey(5, 1)] = { puzzle: getRandomPuzzle(), doorKey: coordKey(6, 6), solved: false, name: "Alpha" };
        puzzles[coordKey(33, 11)] = { puzzle: getRandomPuzzle(), doorKey: coordKey(12, 4), solved: false, name: "Beta" };
        puzzles[coordKey(10, 3)] = { puzzle: getRandomPuzzle(), doorKey: coordKey(7, 16), solved: false, name: "Gamma" };
        puzzles[coordKey(5, 16)] = { puzzle: getRandomPuzzle(), doorKey: coordKey(24, 19), solved: false, name: "Exit" };

        Object.values(puzzles).forEach(p => { doors[p.doorKey] = { open: false }; });
        log('Sistema: Sobreviviente detectado. Accede al búnker de seguridad.');
    }

    // --- NUEVO: Configuración y Lógica del Temporizador de Trampas ---
    const TRAP_INTERVAL = 2000; // Las trampas cambian de estado cada 2 segundos.

    function startTrapCycle() {
        trapIntervalId = setInterval(() => {
            // 1. Alterna el estado (activo/inactivo) de cada trampa en nuestra variable.
            for (const key in traps) {
                traps[key].active = !traps[key].active;
            }
            // 2. Vuelve a dibujar el mapa para que los cambios sean visibles.
            render();
        }, TRAP_INTERVAL);
    }

    function render() {
        mapEl.innerHTML = '';
        const currentVisible = new Set();
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (isVisible(x, y)) {
                    currentVisible.add(coordKey(x, y));
                }
            }
        }

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
                    // --- MODIFICADO: Comprueba si la trampa está `active` para revelarla. ---
                    if (traps[key] && traps[key].active) {
                        texture.classList.add('revealed');
                    }
                }
                else if (type === 5) texture.classList.add('clue');
                cell.appendChild(texture);

                if (player.x === x && player.y === y) {
                    const playerEl = document.createElement('div');
                    playerEl.className = 'player';
                    cell.appendChild(playerEl);
                }
                if (!currentVisible.has(key)) {
                    cell.classList.add('hidden');
                }
                mapEl.appendChild(cell);
            }
        }
        posEl.textContent = `${player.x}, ${player.y}`;
        livesEl.textContent = '❤️'.repeat(player.lives > 0 ? player.lives : 0);
        renderKeysUI();
    }

    function renderKeysUI() {
        keysListEl.innerHTML = '';
        if (unlockedKeys.size === 0) {
            keysListEl.innerHTML = '<div>Ninguna...</div>';
        } else {
            unlockedKeys.forEach(keyName => {
                const d = document.createElement('div');
                d.className = 'key-item';
                d.textContent = `🔑 Llave de Acceso ${keyName}`;
                keysListEl.appendChild(d);
            });
        }
    }

    function move(dx, dy) {
        if (player.lives <= 0 || modalOverlay.style.display === 'flex') return;
        const nx = player.x + dx, ny = player.y + dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return;
        const tileType = map[ny][nx];
        const key = coordKey(nx, ny);
        if (tileType === 1) return;
        if (tileType === 2 && doors[key] && !doors[key].open) { log(`ALERTA: Puerta ${key} sellada.`); return; }

        player.x = nx;
        player.y = ny;

        if (tileType === 3) {
            log('¡Has alcanzado el búnker de seguridad!');
            endGame(true);
        }
        // --- MODIFICADO: Lógica de daño de trampas ---
// Dentro de la función move(dx, dy)

// ...

        else if (tileType === 4) {
            const trapKey = key;
            // Comprobamos si la trampa existe en nuestro registro Y si está activa.
            if (traps[trapKey] && traps[trapKey].active) {
                player.lives--;
                log('¡Peligro! Has pisado una trampa activa. Vidas -1.');

                // --- LÍNEAS PARA LA SACUDIDA ---
                document.body.classList.add('shake-animation');
                setTimeout(() => document.body.classList.remove('shake-animation'), 500);
                // ---------------------------------

                // Desactivamos la trampa al instante para evitar daño múltiple.
                traps[trapKey].active = false;

                if (player.lives <= 0) endGame(false);
            }
        }

// ...
        else if (tileType === 5) {
            const puzzleData = puzzles[key];
            if (puzzleData && !puzzleData.solved) {
                currentCaptcha = puzzleData;
                showCaptchaModal(puzzleData.puzzle);
            } else if (puzzleData && puzzleData.solved) {
                log(`Terminal ${puzzleData.name} ya hackeado. Llave obtenida.`);
            }
        }
        render();
    }

    function showCaptchaModal(puzzle) {
        selectedCaptchaIndices = [];
        captchaPrompt.textContent = puzzle.prompt;
        captchaGrid.innerHTML = '';
        puzzle.images.forEach((imgFile, index) => {
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

    function handleCaptchaSubmit() {
        const correct = currentCaptcha.puzzle.correctIndices;
        const isCorrect = correct.length === selectedCaptchaIndices.length && correct.every(i => selectedCaptchaIndices.includes(i));

        if (isCorrect) {
            log(`Verificación humana exitosa. Llave de acceso "${currentCaptcha.name}" obtenida.`);
            currentCaptcha.solved = true;
            doors[currentCaptcha.doorKey].open = true;
            unlockedKeys.add(currentCaptcha.name);
        } else {
            player.lives--;
            log('Verificación fallida. La IA ha reforzado sus defensas.');
            if (player.lives <= 0) endGame(false);
        }
        modalOverlay.style.display = 'none';
        render();
    }

    function endGame(didWin) {
        if (trapIntervalId) {
            clearInterval(trapIntervalId);
        }
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
    window.addEventListener('keydown', (e) => {
        if (modalOverlay.style.display === 'flex') return;
        const keyMap = { 'ArrowUp': [0, -1], 'ArrowDown': [0, 1], 'ArrowLeft': [-1, 0], 'ArrowRight': [1, 0] };
        if (keyMap[e.key]) {
            e.preventDefault();
            move(...keyMap[e.key]);
        }
    });

    // --- Iniciar Juego ---
    setupLevel();
    render();
    startTrapCycle(); // <-- Inicia el ciclo de las trampas
}
