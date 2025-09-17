/**
 * Juego 1: Luz Roja, Luz Verde
 */
function initLuzRojaGame(roomName, stageName, winToken) {
    const trafficLight = document.getElementById('traffic-light');
    const runButton = document.getElementById('run-button');
    const progressBar = document.getElementById('progress-bar');
    const progressDisplay = document.getElementById('progress-display');
    const timerDisplay = document.getElementById('timer-display');
    const gameMessage = document.getElementById('game-message');

    let gameActive = false;
    let countdownInterval;

    async function startGame() {
        runButton.disabled = true;
        const response = await fetch('/api/squid/luzroja/start', { method: 'POST' });
        const data = await response.json();

        gameActive = true;
        runButton.disabled = false;
        updateProgress(0);
        updateLightUI(data.lightState);

        let timeLeft = data.timeLeft;
        timerDisplay.textContent = `Tiempo: ${timeLeft}s`;
        countdownInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `Tiempo: ${timeLeft}s`;
            if (timeLeft <= 0) {
                // The server will ultimately decide, but this gives immediate feedback
                endGame(false, '¡Se acabó el tiempo!');
            }
        }, 1000);
    }

    function updateProgress(progress) {
        const percentage = Math.min(progress, 100);
        progressBar.style.width = `${percentage}%`;
        progressDisplay.textContent = `${percentage}%`;
    }

    function updateLightUI(lightState) {
        const lightColors = {
            green: '#28a745',
            yellow: '#ffc107',
            red: '#dc3545'
        };
        trafficLight.style.backgroundColor = lightColors[lightState] || '#343a40';
        trafficLight.style.boxShadow = `0 0 25px ${lightColors[lightState] || '#343a40'}`;
    }

    runButton.addEventListener('click', async () => {
        if (!gameActive) return;

        try {
            const response = await fetch('/api/squid/luzroja/run', { method: 'POST' });
            if (!response.ok) throw new Error('Run request failed');
            const data = await response.json();

            updateLightUI(data.light_state); // Update light based on server's current state
            if (data.new_progress) {
                updateProgress(data.new_progress);
            }

            if (data.game_over) {
                endGame(data.win, data.message);
            }
        } catch (error) {
            console.error("Error during run:", error);
            gameMessage.textContent = "Error de conexión.";
        }
    });

    function endGame(isWin, message) {
        if (!gameActive) return;
        gameActive = false;
        clearInterval(countdownInterval);
        runButton.disabled = true;
        gameMessage.textContent = message;

        if (isWin) {
            gameMessage.className = 'text-success';
            // Ensure final progress is 100% on win
            updateProgress(100);
            setTimeout(() => submitWin(roomName, stageName, winToken), 1500);
        } else {
            gameMessage.className = 'text-danger';
            failGame(message, roomName);
        }
    }

    startGame();
}
