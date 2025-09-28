function initLuzRojaGame(roomName, stageName, winToken) {
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

    let gameState = {
        player_pos: null,
        map: null,
        light_state: 'green',
        time_left: 0,
        game_over: false,
        win: false
    };

    let lightStateTimeout;
    let masterTimerInterval;
    let questionTimerInterval;

    function renderBoard(map, playerPos) {
        if (!map || !playerPos) return;
        boardElement.innerHTML = '';
        const rows = map.length;
        const cols = map[0].length;
        boardElement.style.gridTemplateColumns = `repeat(${cols}, 25px)`;

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const tile = document.createElement('div');
                tile.className = `tile tile-${map[y][x]}`;
                if (playerPos.x === x && playerPos.y === y) {
                    const playerDiv = document.createElement('div');
                    playerDiv.className = 'player';
                    tile.appendChild(playerDiv);
                }
                boardElement.appendChild(tile);
            }
        }
    }

    function updateLightUI(lightState) {
        gameState.light_state = lightState;
        lightStatusElement.className = `light-status ${lightState === 'green' ? 'light-green' : 'light-red'}`;
        lightStatusElement.textContent = lightState === 'green' ? 'LUZ VERDE' : 'LUZ ROJA';
    }

    function updateMasterTimer() {
        if (gameState.time_left > 0) {
            gameState.time_left--;
            const minutes = Math.floor(gameState.time_left / 60);
            const seconds = gameState.time_left % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            // BUG FIX: Se pasa el efecto 'shake' para que la animación se active.
            endGame(false, "¡Se acabó el tiempo!", ['shake']);
        }
    }

    function handleEffects(effects = []) {
        if (effects.includes('shake')) {
            gameContainer.classList.add('shake-animation');
            setTimeout(() => gameContainer.classList.remove('shake-animation'), 500);
        }
    }

    // REFACTOR: La función ahora acepta un array de efectos para centralizar la lógica.
    function endGame(isWin, message, effects = []) {
        if (gameState.game_over) return;
        gameState.game_over = true;
        gameState.win = isWin;

        clearTimeout(lightStateTimeout);
        clearInterval(masterTimerInterval);
        clearInterval(questionTimerInterval);

        messageElement.textContent = message;
        handleEffects(effects);

        if (isWin) {
            submitWin(roomName, stageName, winToken);
        } else {
            // Se espera 500ms si la animación de shake está activa para que sea visible.
            const delay = effects.includes('shake') ? 500 : 0;
            setTimeout(() => failGame(message, roomName), delay);
        }
    }

    async function requestNextLightState() {
        if (gameState.game_over) return;

        try {
            const response = await fetch('/api/squid/luzroja/state');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            if (data.error || gameState.game_over) {
                return;
            }

            updateLightUI(data.light_state);
            lightStateTimeout = setTimeout(requestNextLightState, data.duration);

        } catch (error) {
            console.error("Error fetching new light state:", error);
        }
    }

    async function handleKeydown(e) {
        if (questionModal.style.display === 'flex' || gameState.game_over) return;

        let dx = 0, dy = 0;
        switch(e.key) {
            case 'ArrowUp': dy = -1; break;
            case 'ArrowDown': dy = 1; break;
            case 'ArrowLeft': dx = -1; break;
            case 'ArrowRight': dx = 1; break;
            default: return;
        }

        const response = await fetch('/api/squid/luzroja/move', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ dx, dy })
        });
        const data = await response.json();

        if (data.status === 'game_over') {
            // BUG FIX: Se pasa el array de efectos a endGame para centralizar la lógica.
            endGame(false, data.message, data.effects);
        } else if (data.status === 'ask_question') {
            showQuestion(data.question);
        } else if (data.status === 'success') {
            gameState.player_pos = data.new_pos;
            renderBoard(gameState.map, gameState.player_pos);
            if (data.message) messageElement.textContent = data.message;
            if (data.win) {
                endGame(true, "¡Has escapado!");
            }
        }
    }

    function showQuestion(question) {
        clearTimeout(lightStateTimeout);
        // BUG FIX: No se detiene el temporizador principal. El tiempo debe seguir corriendo.
        // clearInterval(masterTimerInterval);

        questionText.textContent = question;
        questionModal.style.display = 'flex';
        answerInput.focus();

        let qTime = 10;
        questionTimerElement.textContent = qTime;
        questionTimerElement.style.color = 'var(--squid-text)';

        questionTimerInterval = setInterval(() => {
            qTime--;
            questionTimerElement.textContent = qTime;
            if (qTime <= 3) {
                questionTimerElement.style.color = 'var(--squid-red)';
            }
            if (qTime <= 0) {
                clearInterval(questionTimerInterval);
                // Al expirar el tiempo, se llama a submitAnswer. El servidor se encargará
                // de la lógica de timeout, reseteando la posición del jugador y
                // asegurando que el estado del juego esté sincronizado.
                submitAnswer();
            }
        }, 1000);
    }

    function hideQuestion(message) {
        clearInterval(questionTimerInterval);
        questionModal.style.display = 'none';
        answerInput.value = '';
        messageElement.textContent = message;
    }

    async function submitAnswer() {
        const answer = answerInput.value;
        clearInterval(questionTimerInterval);

        const response = await fetch('/api/squid/luzroja/answer', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ answer })
        });
        const data = await response.json();

        hideQuestion(data.message);
        gameState.player_pos = data.player_pos;
        renderBoard(gameState.map, gameState.player_pos);
        if (data.effects) handleEffects(data.effects);

        lightStateTimeout = setTimeout(requestNextLightState, 1000);
        // BUG FIX: El temporizador principal ya no se detiene, por lo que no es necesario reiniciarlo.
        // masterTimerInterval = setInterval(updateMasterTimer, 1000);
    }

    async function startGame() {
        messageElement.textContent = "Iniciando nueva partida...";
        const response = await fetch('/api/squid/luzroja/start', { method: 'POST' });
        const data = await response.json();

        if (data.error) {
            endGame(false, data.error);
            return;
        }

        Object.assign(gameState, data);
        renderBoard(gameState.map, gameState.player_pos);
        updateLightUI(data.light_state);

        masterTimerInterval = setInterval(updateMasterTimer, 1000);
        lightStateTimeout = setTimeout(requestNextLightState, data.duration);

        document.addEventListener('keydown', handleKeydown);
        submitAnswerBtn.addEventListener('click', submitAnswer);
        answerInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') submitAnswer();
        });
        messageElement.textContent = "Usa las flechas para moverte.";
    }

    startGame();
}

document.addEventListener('DOMContentLoaded', () => {
    initLuzRojaGame(room_name, stage_name, win_token);
});