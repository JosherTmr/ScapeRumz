/**
 * REFACTORIZACIÓN COMPLETA DEL JUEGO LUZ ROJA, LUZ VERDE
 * ------------------------------------------------------
 * Implementa un bucle de juego basado en sondeo (polling) para mantener
 * al cliente sincronizado con un estado de juego autoritativo del servidor.
 * Esto resuelve problemas de desincronización y mejora la fluidez.
 */
function initLuzRojaGame(roomName, stageName, winToken) {
    // Referencias a elementos del DOM
    const gameContainer = document.querySelector('.game-container');
    const boardElement = document.getElementById('game-board');
    const timerElement = document.getElementById('timer');
    const lightStatusElement = document.getElementById('light-status');
    const messageElement = document.getElementById('game-message');
    const questionModal = document.getElementById('question-modal');
    const questionText = document.getElementById('question-text');
    const questionTimerElement = document.getElementById('question-timer');
    const answerInput = document.getElementById('answer-input');
    const submitAnswerBtn = document.getElementById('submit-answer');

    let playerElement = null; // Referencia al div del jugador
    let gameLoopInterval = null; // ID del intervalo del bucle de juego
    let isGameOver = false; // Flag para detener el bucle

    /**
     * Optimización: Renderiza el tablero una sola vez, sin el jugador.
     * El jugador se crea como un elemento separado.
     */
    function renderBoard(map) {
        boardElement.innerHTML = '';
        const rows = map.length;
        const cols = map[0].length;
        boardElement.style.gridTemplateColumns = `repeat(${cols}, 25px)`;

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const tile = document.createElement('div');
                tile.className = `tile tile-${map[y][x]}`;
                boardElement.appendChild(tile);
            }
        }

        // Crear el jugador una vez y añadirlo al tablero
        playerElement = document.createElement('div');
        playerElement.className = 'player';
        boardElement.appendChild(playerElement);
    }

    /**
     * CORREGIDO: Mueve al jugador encontrando la celda del tablero correcta y
     * añadiéndolo como hijo. Esto preserva la estructura DOM esperada por el CSS
     * (.tile > .player) y es más eficiente que un re-renderizado completo.
     */
    function updatePlayerPosition(pos) {
        if (playerElement && pos) {
            const cols = 15; // Ancho del tablero definido en la configuración
            const tileIndex = pos.y * cols + pos.x;
            const targetTile = boardElement.children[tileIndex];
            if (targetTile) {
                targetTile.appendChild(playerElement);
            }
        }
    }

    // Actualiza la UI del temporizador principal
    function updateTimerUI(timeLeft) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Actualiza la UI del semáforo
    function updateLightUI(lightState) {
        const newClass = `light-status ${lightState === 'green' ? 'light-green' : 'light-red'}`;
        if (lightStatusElement.className !== newClass) {
            lightStatusElement.className = newClass;
            lightStatusElement.textContent = lightState === 'green' ? 'LUZ VERDE' : 'LUZ ROJA';
        }
    }

    // Muestra u oculta el modal de pregunta
    function updateQuestionUI(question, qTimeLeft) {
        if (question) {
            questionText.textContent = question;
            questionTimerElement.textContent = qTimeLeft;
            questionTimerElement.style.color = qTimeLeft <= 3 ? 'var(--squid-red)' : 'var(--squid-text)';
            if (questionModal.style.display !== 'flex') {
                questionModal.style.display = 'flex';
                answerInput.focus();
            }
        } else {
            if (questionModal.style.display !== 'none') {
                questionModal.style.display = 'none';
                answerInput.value = '';
            }
        }
    }

    // Maneja los efectos visuales como el temblor
    function handleEffects(effects = []) {
        if (effects.includes('shake')) {
            gameContainer.classList.add('shake-animation');
            setTimeout(() => gameContainer.classList.remove('shake-animation'), 500);
        }
    }

    /**
     * Función central del bucle de juego.
     * Solicita el estado al servidor y actualiza toda la UI.
     */
    async function updateGameState() {
        if (isGameOver) {
            clearInterval(gameLoopInterval);
            return;
        }

        try {
            const response = await fetch('/api/squid/luzroja/gamestate');
            if (!response.ok) throw new Error('Failed to fetch gamestate');
            const state = await response.json();

            if (state.error) {
                console.error("Error from server:", state.error);
                isGameOver = true;
                return;
            }

            // Actualizar todos los componentes de la UI con el estado del servidor
            updatePlayerPosition(state.player_pos);
            updateTimerUI(state.time_left);
            updateLightUI(state.light_state);
            updateQuestionUI(state.question, state.q_time_left);
            messageElement.textContent = state.message;
            handleEffects(state.effects);

            // Comprobar condiciones de fin de juego
            if (state.game_over) {
                isGameOver = true;
                clearInterval(gameLoopInterval);
                const delay = (state.effects && state.effects.includes('shake')) ? 500 : 0;
                setTimeout(() => {
                    if (state.win) {
                        submitWin(roomName, stageName, winToken);
                    } else {
                        failGame(state.message, roomName);
                    }
                }, delay);
            }
        } catch (error) {
            console.error("Error updating game state:", error);
            isGameOver = true; // Detener el juego si hay un error de red
        }
    }

    // Envía el movimiento del jugador al servidor
    async function handleKeydown(e) {
        if (isGameOver || questionModal.style.display === 'flex') return;

        let dx = 0, dy = 0;
        switch(e.key) {
            case 'ArrowUp': dy = -1; break;
            case 'ArrowDown': dy = 1; break;
            case 'ArrowLeft': dx = -1; break;
            case 'ArrowRight': dx = 1; break;
            default: return;
        }

        // No se necesita manejar la respuesta, el bucle de juego lo hará
        await fetch('/api/squid/luzroja/move', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ dx, dy })
        });
    }

    // Envía la respuesta a la pregunta al servidor
    async function submitAnswer() {
        if (isGameOver) return;
        const answer = answerInput.value;
        answerInput.value = ''; // Limpiar input inmediatamente

        // No se necesita manejar la respuesta, el bucle de juego lo hará
        await fetch('/api/squid/luzroja/answer', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ answer })
        });
    }

    // Inicializa el juego
    async function startGame() {
        messageElement.textContent = "Iniciando nueva partida...";
        const response = await fetch('/api/squid/luzroja/start', { method: 'POST' });
        const data = await response.json();

        if (data.error) {
            failGame(data.error, roomName);
            return;
        }

        renderBoard(data.map);

        // Configurar listeners de eventos
        document.addEventListener('keydown', handleKeydown);
        submitAnswerBtn.addEventListener('click', submitAnswer);
        answerInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') submitAnswer();
        });

        // Iniciar el bucle de juego principal
        gameLoopInterval = setInterval(updateGameState, 250); // Sondea 4 veces por segundo
    }

    startGame();
}

document.addEventListener('DOMContentLoaded', () => {
    // Las variables room_name, stage_name y win_token son inyectadas
    // globalmente por la plantilla de Jinja2.
    initLuzRojaGame(room_name, stage_name, win_token);
});