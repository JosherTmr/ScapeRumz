/**
 * =============================================================
 * Funciones Auxiliares Globales para el Escape Room
 * ÚNICA FUENTE DE VERDAD PARA TODOS LOS MINIJUEGOS EN ESTE ARCHIVO
 * =============================================================
 */

/**
 * Envía una señal de victoria al backend.
 * @param {string} roomName - El nombre de la sala actual (ej: 'minecraft').
 * @param {string} stageName - El nombre de la etapa actual (ej: 'mapa').
 */
function submitWin(roomName, stageName) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/win/${roomName}/${stageName}`;
    document.body.appendChild(form);
    form.submit();
}

/**
 * Gestiona una derrota y redirige al INICIO de la sala correcta.
 * @param {string} message - El mensaje que se mostrará al jugador.
 * @param {string} roomName - El nombre de la sala que se debe reiniciar (ej: 'minecraft').
 */
function failGame(message, roomName) {
    // Esta es la línea clave. Usa el roomName que recibe para construir la URL de reinicio.
    alert(message + "\n\nSerás redirigido para que puedas intentarlo de nuevo.");
    window.location.href = `/start/${roomName}`;
}

    
function initCraftingEnigmaGame(roomName, stageName) {
    const riddleText = document.getElementById('riddle-text');
    const craftingGrid = document.getElementById('crafting-grid');
    const inventory = document.getElementById('inventory');
    const craftButton = document.getElementById('craft-button');
    const feedback = document.getElementById('feedback');

    const itemTextures = {
        stick: 'https://p.novaskin.me/4905183964.png',
        diamond: 'https://p.novaskin.me/4889073312.png',
        iron_ingot: 'https://p.novaskin.me/4343813293.png',
        gold_ingot: 'https://p.novaskin.me/1811033392.png',
        ender_pearl: 'https://p.novaskin.me/5214243120.png',
        blaze_powder: 'https://p.novaskin.me/4451473145.png',
    };

    const riddles = [{
        riddle: "Con tres joyas celestes y dos esencias del bosque, fabrico la garra que muerde la piedra y jamás se quiebra.",
        ingredients: ['diamond', 'diamond', 'diamond', 'stick', 'stick'].sort(),
        result: 'diamond_pickaxe' // <-- CORRECCIÓN: Coma añadida aquí.
    }, {
        riddle: "Un fragmento del vacío y el fuego de las profundidades se unen para abrir portales prohibidos.",
        ingredients: ['ender_pearl', 'blaze_powder'].sort(),
        result: 'eye_of_ender'
    }];

    let gridState = Array(9).fill(null);
    let currentRiddle;
    let draggedElement = null;

    function setupGame() {
        currentRiddle = riddles[Math.floor(Math.random() * riddles.length)];
        riddleText.textContent = currentRiddle.riddle;
        gridState.fill(null);

        // Limpiar y reconstruir grid
        craftingGrid.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const slot = document.createElement('div');
            slot.classList.add('grid-slot');
            slot.dataset.index = i;
            slot.addEventListener('dragover', (e) => e.preventDefault());
            slot.addEventListener('drop', onDropToGrid);
            craftingGrid.appendChild(slot);
        }

        // CORRECCIÓN: Lógica de inventario para manejar duplicados
        inventory.innerHTML = '';
        inventory.addEventListener('dragover', (e) => e.preventDefault());
        inventory.addEventListener('drop', onDropToInventory);

        const allItems = Object.keys(itemTextures);
        const distractors = allItems
            .filter(item => !currentRiddle.ingredients.includes(item))
            .sort(() => 0.5 - Math.random())
            .slice(0, 2);

        const finalInventoryItems = [...currentRiddle.ingredients, ...distractors].sort(() => 0.5 - Math.random());

        finalInventoryItems.forEach(itemName => {
            const item = document.createElement('div');
            item.classList.add('item');
            item.style.backgroundImage = `url(${itemTextures[itemName]})`;
            item.dataset.item = itemName;
            item.draggable = true;
            item.addEventListener('dragstart', onDragStart);
            inventory.appendChild(item);
        });

        feedback.textContent = '';
    }

    function onDragStart(e) {
        draggedElement = e.target;
        // Efecto visual para indicar que se está arrastrando
        setTimeout(() => e.target.classList.add('dragging'), 0);
    }

    function onDropToGrid(e) {
        e.preventDefault();
        const slot = e.target.closest('.grid-slot');
        if (!slot || slot.firstChild || !draggedElement) return; // Solo si el slot está vacío

        const index = parseInt(slot.dataset.index, 10);
        gridState[index] = draggedElement.dataset.item;
        
        slot.appendChild(draggedElement);
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }

    function onDropToInventory(e) {
        e.preventDefault();
        if (!draggedElement || e.target.closest('.item')) return; // No soltar sobre otro item
        
        // Mueve el item de la grid de vuelta al inventario
        const oldIndex = gridState.indexOf(draggedElement.dataset.item);
        if (oldIndex > -1) {
            gridState[oldIndex] = null;
        }
        
        inventory.appendChild(draggedElement);
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }

    function checkCrafting() {
        const itemsInGrid = gridState.filter(item => item !== null).sort();

        if (JSON.stringify(itemsInGrid) === JSON.stringify(currentRiddle.ingredients)) {
            feedback.textContent = '¡Crafteo exitoso!';
            feedback.className = 'text-success';
            setTimeout(() => submitWin(roomName, stageName), 1500);
        } else {
            feedback.textContent = 'La combinación es incorrecta. Reiniciando...';
            feedback.className = 'text-danger';
            setTimeout(setupGame, 2000);
        }
    }

    craftButton.addEventListener('click', checkCrafting);
    setupGame();
}


/**
 * =ual===========================================================
 * Juego 3: El Mapa del Santuario (Versión 3.1 - Bug de Pistas Corregido)
 * =============================================================
 */
function initMapAdventureGame(roomName, stageName) {
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
            setTimeout(() => submitWin(roomName, stageName), 1000);
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

/**
 * =============================================================
 * Juego del Ahorcado (Versión Difícil - 3 Rondas)
 * =============================================================
 */
function initHangmanGame(roomName, stageName) {
    // --- Selección de Elementos del DOM ---
    const stageText = document.querySelector(".stage-text");
    const wordDisplay = document.querySelector(".word-display");
    const guessesText = document.querySelector(".guesses-text b");
    const keyboardDiv = document.querySelector(".keyboard");
    const hangmanImage = document.querySelector(".hangman-box img");
    const gameModal = document.querySelector(".game-modal");
    const modalContent = gameModal.querySelector(".content");

    // --- NUEVO: Estado del Juego de Múltiples Rondas ---
    let currentWord, correctLetters, wrongGuessCount;
    let wordIndex = 0; // Para rastrear en qué palabra estamos (0, 1, 2)
    let sessionWords = []; // Almacenará las 3 palabras de esta partida
    const maxGuesses = 6;

    const setupNextWord = () => {
        // Selecciona la palabra actual de la lista de la sesión
        const { word, hint } = sessionWords[wordIndex];
        currentWord = word;

        // Actualiza la UI
        stageText.innerText = `Palabra ${wordIndex + 1} de 3`;
        document.querySelector(".hint-text b").innerText = hint;
        
        // Reinicia el tablero
        correctLetters = [];
        wrongGuessCount = 0;
        hangmanImage.src = `https://www-codingnepalweb-com.translate.goog/demos/build-hangman-game-html-javascript/images/hangman-0.svg`;
        guessesText.innerText = `${wrongGuessCount} / ${maxGuesses}`;
        wordDisplay.innerHTML = currentWord.split("").map(() => `<li class="letter"></li>`).join("");
        keyboardDiv.querySelectorAll("button").forEach(btn => btn.disabled = false);
        gameModal.classList.remove("show");
    }

    const selectSessionWords = () => {
        // --- NUEVO: Banco de Palabras con Pistas Ambiguas ---
        const wordList = [
            { word: "CREEPER", hint: "Me acerco en silencio, exploto sin avisar y todos me temen." },
            { word: "PIEDRA", hint: "Soy abundante bajo tus pies, duro como roca, pero fácil de romper con un pico." },
            { word: "REDSTONE", hint: "No soy sangre, pero puedo dar energía y hacer máquinas." },
            { word: "ENDERMAN", hint: "Si me miras a los ojos me enojo, pero me gusta mover bloques." },
            { word: "PORTAL", hint: "Sin mí no puedes viajar al Nether ni al End." },
            { word: "LAVA", hint: "Brillo como el sol, quemo como el fuego, y en mí no debes caer." },
            { word: "YUNQUE", hint: "Soy pesado, sirvo para reparar, y si caigo desde lo alto puedo aplastarte." },
            { word: "LANA", hint: "Lo obtienes de una oveja, con él fabricas tu primera cama." }, // lana
            { word: "ESPADA", hint: "No soy pico ni hacha, pero me usas para defenderte." },
            { word: "ALDEA", hint: "Lugar donde encuentras casas, cultivos y seres que hacen trueques." },
        ];
        

        // Baraja la lista y selecciona las primeras 3 palabras
        sessionWords = wordList.sort(() => 0.5 - Math.random()).slice(0, 3);
        setupNextWord();
    }

    const gameOver = (isVictory) => {
        if (!isVictory) {
            // Si pierdes en cualquier ronda, el juego termina
            setTimeout(() => {
                modalContent.querySelector("img").src = `https://www-codingnepalweb-com.translate.goog/demos/build-hangman-game-html-javascript/images/lost.gif`;
                modalContent.querySelector("h4").innerText = '¡Ahorcado!';
                modalContent.querySelector("p").innerHTML = `La palabra correcta era: <b>${currentWord}</b>`;
                gameModal.classList.add("show");
                setTimeout(() => failGame("Te has quedado sin intentos.", roomName), 2500);
            }, 300);
            return;
        }

        // Si ganas una ronda...
        if (wordIndex < 2) {
            // ...y no es la última, pasa a la siguiente palabra.
            wordIndex++;
            setTimeout(() => {
                modalContent.querySelector("img").src = `https://www-codingnepalweb-com.translate.goog/demos/build-hangman-game-html-javascript/images/victory.gif`;
                modalContent.querySelector("h4").innerText = '¡Correcto!';
                modalContent.querySelector("p").innerHTML = `Prepárate para la siguiente palabra...`;
                gameModal.classList.add("show");
                // Carga la siguiente palabra después de una pausa
                setTimeout(setupNextWord, 2000);
            }, 300);
        } else {
            // ...y es la última, ¡ganaste el minijuego!
            setTimeout(() => {
                modalContent.querySelector("img").src = `https://www-codingnepalweb-com.translate.goog/demos/build-hangman-game-html-javascript/images/victory.gif`;
                modalContent.querySelector("h4").innerText = '¡Desafío Superado!';
                modalContent.querySelector("p").innerHTML = `Has adivinado todas las palabras.`;
                gameModal.classList.add("show");
                setTimeout(() => submitWin(roomName, stageName), 2000);
            }, 300);
        }
    }

    const initGame = (e) => {
        const clickedLetter = e.target.value;
        if (clickedLetter.match(/^[A-Z]$/) && !e.target.disabled) {
            e.target.disabled = true;
            if (currentWord.includes(clickedLetter)) {
                [...currentWord].forEach((letter, index) => {
                    if (letter === clickedLetter) {
                        correctLetters.push(letter);
                        wordDisplay.querySelectorAll("li")[index].innerText = letter;
                        wordDisplay.querySelectorAll("li")[index].classList.add("guessed");
                    }
                });
            } else {
                wrongGuessCount++;
                hangmanImage.src = `https://www-codingnepalweb-com.translate.goog/demos/build-hangman-game-html-javascript/images/hangman-${wrongGuessCount}.svg`;
            }
            guessesText.innerText = `${wrongGuessCount} / ${maxGuesses}`;

            if (wrongGuessCount === maxGuesses) return gameOver(false);
            if (correctLetters.length === currentWord.length) return gameOver(true);
        }
    }

    // --- Creación del Teclado (sin cambios) ---
    for (let i = 65; i <= 90; i++) {
        const button = document.createElement("button");
        button.value = String.fromCharCode(i);
        button.innerText = String.fromCharCode(i);
        keyboardDiv.appendChild(button);
        button.addEventListener("click", initGame);
    }
    
    // Iniciar el juego por primera vez
    selectSessionWords();
}


/**
 * =============================================================
 * Juego 4: Memoria de Mobs (v1.1 - Con vista previa inicial)
 * =============================================================
 */
function initMemoryGame(roomName, stageName) {
    // --- Referencias al DOM ---
    const gameBoard = document.getElementById('memory-game-board');
    const livesDisplay = document.getElementById('lives-display');
    const resetButton = document.getElementById('reset-button');
    const gameStatus = document.getElementById('game-status'); // <-- NUEVA REFERENCIA

    // --- Configuración del Juego ---
    const MAX_LIVES = 3;
    const TOTAL_PAIRS = 12;
    const PREVIEW_TIME = 3000; // 3 segundos de vista previa

    // --- Texturas de Mobs (sin cambios) ---
    const mobTextures = [
        { name: 'steve',    img: '/static/img/steve.png' },
        { name: 'zombie',   img: '/static/img/zombie.jpg' },
        { name: 'skeleton', img: '/static/img/esqueleto.png' },
        { name: 'spider',   img: '/static/img/arana.jpg' },
        { name: 'enderman', img: '/static/img/enderman.jpg' },
        { name: 'pig',      img: '/static/img/cerdo.jpg' },
        { name: 'cow',      img: '/static/img/vaca.jpg' },
        { name: 'sheep',    img: '/static/img/oveja.jpg' },
        { name: 'ghast',    img: '/static/img/ghast.jpg' },
        { name: 'blaze',    img: '/static/img/blaze.jpg' },
        { name: 'villager', img: '/static/img/aldeano.jpg' },
        { name: 'axolotl',  img: '/static/img/ajolote.png' }
      ];
      
      const creeperCard = { 
        name: 'creeper', 
        img: '/static/img/player.jpg' // asegúrate de guardarlo en la carpeta
      };
      
      

    // --- Estado del Juego ---
    let lives;
    let cards = [];
    let firstCard, secondCard;
    let lockBoard;
    let matchedPairs;

    /** Baraja un array usando el algoritmo Fisher-Yates */
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    /** Prepara y renderiza el tablero de juego */
    function setupGame() {
        // Reiniciar estado
        lives = MAX_LIVES;
        matchedPairs = 0;
        firstCard = null;
        secondCard = null;
        gameStatus.textContent = ''; // Limpia el estado
        
        let cardPool = [...mobTextures, ...mobTextures];
        cardPool.push(creeperCard);
        cards = shuffle(cardPool);
        
        gameBoard.innerHTML = '';
        updateLivesUI();

        cards.forEach(cardData => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card');
            cardElement.dataset.mob = cardData.name;
            cardElement.innerHTML = `
                <div class="card-face card-front"><img src="${cardData.img}" alt="${cardData.name}"></div>
                <div class="card-face card-back"></div>`;
            cardElement.addEventListener('click', flipCard);
            gameBoard.appendChild(cardElement);
        });
        
        // --- INICIO DE LA LÓGICA DE VISTA PREVIA ---
        lockBoard = true; // Bloquea el tablero durante la vista previa
        gameStatus.textContent = 'Memoriza la posición...';
        const allCards = document.querySelectorAll('.card');

        // 1. Muestra todas las cartas
        allCards.forEach(card => card.classList.add('flip'));

        // 2. Después de PREVIEW_TIME, las oculta y permite jugar
        setTimeout(() => {
            allCards.forEach(card => card.classList.remove('flip'));
            lockBoard = false; // Desbloquea el tablero
            gameStatus.textContent = '¡A jugar!';
            // Opcional: limpiar el mensaje después de un rato
            setTimeout(() => gameStatus.textContent = '', 1500);
        }, PREVIEW_TIME);
        // --- FIN DE LA LÓGICA DE VISTA PREVIA ---
    }

    /** Maneja el evento de hacer clic en una carta */
    function flipCard() {
        if (lockBoard || this === firstCard || this.classList.contains('matched')) return;
        this.classList.add('flip');
        if (!firstCard) {
            firstCard = this;
            return;
        }
        secondCard = this;
        lockBoard = true;
        checkForMatch();
    }

    /** Comprueba si las dos cartas volteadas son un par */
    function checkForMatch() {
        const isMatch = firstCard.dataset.mob === secondCard.dataset.mob;
        const isCreeper = firstCard.dataset.mob === 'creeper' || secondCard.dataset.mob === 'creeper';

        if (isMatch && !isCreeper) {
            matchedPairs++;
            disableCards();
            if (matchedPairs === TOTAL_PAIRS) {
                gameStatus.textContent = '¡Has ganado!';
                setTimeout(() => submitWin(roomName, stageName), 1000);
            }
        } else {
            loseLife();
            unflipCards();
        }
    }

    /** Mantiene las cartas volteadas y las deshabilita */
    function disableCards() {
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');
        firstCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('click', flipCard);
        resetBoard();
    }

    /** Voltea las cartas si no son un par */
    function unflipCards() {
        setTimeout(() => {
            firstCard.classList.remove('flip');
            secondCard.classList.remove('flip');
            resetBoard();
        }, 1200);
    }
    
    /** Resetea las variables para el siguiente turno */
    function resetBoard() {
        [firstCard, secondCard, lockBoard] = [null, null, false];
    }
    
    /** Reduce una vida y gestiona la derrota */
    function loseLife() {
        lives--;
        updateLivesUI();
        gameBoard.classList.add('shake-animation');
        setTimeout(() => gameBoard.classList.remove('shake-animation'), 400);

        if (lives <= 0) {
            gameStatus.textContent = '¡Has perdido!';
            lockBoard = true;
            setTimeout(() => {
                failGame("El Creeper ha saboteado tu memoria. ¡Inténtalo de nuevo!", roomName);
            }, 1500);
        }
    }

    /** Actualiza la UI de las vidas */
    function updateLivesUI() {
        livesDisplay.textContent = '❤️'.repeat(lives) + '🖤'.repeat(MAX_LIVES - lives);
    }

    // --- Inicialización ---
    resetButton.addEventListener('click', setupGame);
    setupGame();
}



/**
 * =============================================================
 * Juego 5: Tira y Afloja Minero
 * =============================================================
 */
function initTugOfWarGame(roomName, stageName) {
    // --- Referencias al DOM ---
    const ropeMarker = document.getElementById('rope-marker');
    const questionTitle = document.getElementById('question-title');
    const optionsButtons = document.getElementById('options-buttons');
    const gameResult = document.getElementById('game-result');

    // --- Estado del Juego ---
    let ropePosition = 50; // Posición en porcentaje (50% es el centro)
    let gameActive = true;
    let opponentPullInterval;

    // --- Banco de Preguntas (Cultura General) ---
    const questions = [
        { q: "¿Cuál es la capital de Australia?", a: "Canberra", o: ["Sídney", "Melbourne", "Perth"] },
        { q: "¿Quién pintó la Mona Lisa?", a: "Leonardo da Vinci", o: ["Vincent van Gogh", "Pablo Picasso", "Miguel Ángel"] },
        { q: "¿Cuál es el océano más grande del mundo?", a: "Océano Pacífico", o: ["Océano Atlántico", "Océano Índico", "Océano Ártico"] },
        { q: "¿Qué civilización construyó Machu Picchu?", a: "Inca", o: ["Azteca", "Maya", "Egipcia"] },
        { q: "¿En qué año llegó el hombre a la Luna por primera vez?", a: "1969", o: ["1959", "1979", "1989"] },
        { q: "¿Cuál es el río más largo del mundo?", a: "Amazonas", o: ["Nilo", "Misisipi", "Yangtsé"] },
        { q: "¿Qué elemento tiene el símbolo químico 'Au'?", a: "Oro", o: ["Plata", "Argón", "Aluminio"] },
        { q: "¿Quién escribió 'Cien años de soledad'?", a: "Gabriel García Márquez", o: ["Mario Vargas Llosa", "Julio Cortázar", "Pablo Neruda"] },
        { q: "¿Cuál es el país más poblado del mundo?", a: "India", o: ["China", "Estados Unidos", "Indonesia"] },
        { q: "¿Qué planeta es conocido como el 'Planeta Rojo'?", a: "Marte", o: ["Júpiter", "Venus", "Saturno"] }
    ];

    /** Inicia el juego, carga la primera pregunta y activa al oponente */
    function startGame() {
        gameActive = true;
        loadNextQuestion();
        
        // El zombie tira de la cuerda a un ritmo constante
        opponentPullInterval = setInterval(() => {
            if (!gameActive) return;
            ropePosition -= 1.2; // El zombie tira
            updateRopeUI();
            checkWinCondition();
        }, 500); // Un poco más rápido para aumentar el desafío
    }

    /** Actualiza la posición visual del Golem */
    function updateRopeUI() {
        ropeMarker.style.left = `${ropePosition}%`;
    }

    /** Carga una nueva pregunta y sus opciones aleatorias */
    function loadNextQuestion() {
        if (!gameActive) return;

        const questionIndex = Math.floor(Math.random() * questions.length);
        const currentQuestion = questions[questionIndex];
        
        questionTitle.textContent = currentQuestion.q;
        optionsButtons.innerHTML = '';
        
        const options = [...currentQuestion.o, currentQuestion.a];
        // Barajar las opciones
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'btn-option'; // Clase personalizada para el estilo
            button.textContent = option;
            button.onclick = () => handleAnswer(option, currentQuestion.a);
            optionsButtons.appendChild(button);
        });
    }

    /** Procesa la respuesta del jugador */
    function handleAnswer(selectedAnswer, correctAnswer) {
        if (!gameActive) return;

        if (selectedAnswer === correctAnswer) {
            ropePosition += 10; // Fuerte tirón al acertar
        } else {
            ropePosition -= 8; // El jugador tropieza y el zombie aprovecha
        }
        
        updateRopeUI();
        checkWinCondition();
        loadNextQuestion();
    }
    
    /** Verifica si alguien ha ganado */
    function checkWinCondition() {
        if (ropePosition >= 95) {
            endGame(true); // Gana el jugador
        } else if (ropePosition <= 5) {
            endGame(false); // Gana el oponente (zombie)
        }
    }

    /** Finaliza el juego y muestra el resultado */
    function endGame(playerWon) {
        if (!gameActive) return;
        gameActive = false;
        clearInterval(opponentPullInterval);
        
        optionsButtons.innerHTML = '';
        
        if (playerWon) {
            gameResult.textContent = "¡VICTORIA!";
            questionTitle.textContent = '¡Has ganado la batalla!';
            ropePosition = 100;
            updateRopeUI();
            setTimeout(() => submitWin(roomName, stageName), 1500);
        } else {
            gameResult.textContent = "DERROTA.";
            questionTitle.textContent = '¡La horda se acerca!';
            ropePosition = 0;
            updateRopeUI();
            // La función failGame debería redirigir o reiniciar, según tu lógica global
            failGame("El creeper fue más fuerte. ¡Inténtalo de nuevo!", roomName);
        }
    }

    // Iniciar el juego
    startGame();
}