/**
 * Juego 1: Luz Roja, Luz Verde (Refactorizado)
 */
function initLuzRojaGame(roomName, stageName, winToken) {
    const trafficLight = document.getElementById('traffic-light');
    const runButton = document.getElementById('run-button');
    const progressBar = document.getElementById('progress-bar');
    const progressDisplay = document.getElementById('progress-display');
    const timerDisplay = document.getElementById('timer-display');
    const gameMessage = document.getElementById('game-message');

    let gameActive = false;
    let pollerInterval;

    // Función para actualizar la UI
    function updateUI(data) {
        // Actualizar semáforo
        const lightColors = { green: '#28a745', yellow: '#ffc107', red: '#dc3545' };
        trafficLight.style.backgroundColor = lightColors[data.light_state] || '#343a40';
        trafficLight.style.boxShadow = `0 0 25px ${lightColors[data.light_state] || '#343a40'}`;

        // Actualizar tiempo y progreso
        timerDisplay.textContent = `Tiempo: ${data.time_left || 0}s`;
        const percentage = Math.min(data.progress || 0, 100);
        progressBar.style.width = `${percentage}%`;
        progressDisplay.textContent = `${percentage}%`;
    }

    // Poller que consulta el estado del juego al servidor
    async function pollGameState() {
        if (!gameActive) return;

        try {
            const response = await fetch('/api/squid/luzroja/state');
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }
            const data = await response.json();

            if (data.error) {
                endGame(false, data.error);
                return;
            }

            updateUI(data);

            if (data.game_over) {
                endGame(data.win, data.message);
            }
        } catch (error) {
            console.error("Error polling game state:", error);
            gameMessage.textContent = "Error de conexión. Reintentando...";
        }
    }

    // Evento del botón para correr
    runButton.addEventListener('click', async () => {
        if (!gameActive) return;

        try {
            const response = await fetch('/api/squid/luzroja/run', { method: 'POST' });
            const data = await response.json();

            if (data.new_progress) {
                updateUI({ progress: data.new_progress, light_state: 'green', time_left: parseInt(timerDisplay.textContent.split(' ')[1]) });
            }

            if (data.game_over) {
                endGame(data.win, data.message);
            } else if (data.message) {
                // Muestra mensajes como "¡Sigue corriendo!"
                // gameMessage.textContent = data.message;
            }
        } catch (error) {
            console.error("Error during run:", error);
            gameMessage.textContent = "Error de conexión.";
        }
    });

    // Función para finalizar el juego
    function endGame(isWin, message) {
        if (!gameActive) return;
        gameActive = false;
        clearInterval(pollerInterval);
        runButton.disabled = true;
        gameMessage.textContent = message;

        if (isWin) {
            gameMessage.className = 'text-success';
            updateUI({ progress: 100, light_state: 'green' });
            setTimeout(() => submitWin(roomName, stageName, winToken), 1500);
        } else {
            gameMessage.className = 'text-danger';
            failGame(message, roomName);
        }
    }

    // Iniciar el juego
    async function startGame() {
        runButton.disabled = true;
        const response = await fetch('/api/squid/luzroja/start', { method: 'POST' });
        if (!response.ok) {
            gameMessage.textContent = "No se pudo iniciar el juego.";
            return;
        }
        const data = await response.json();

        gameActive = true;
        runButton.disabled = false;
        updateUI({ progress: data.progress, light_state: data.lightState, time_left: data.timeLeft });

        // Inicia el poller para actualizar el estado del juego
        pollerInterval = setInterval(pollGameState, 100); // Consulta cada 100ms
    }

    startGame();
}
