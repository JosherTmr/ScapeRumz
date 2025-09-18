/**
 * Inicializa y controla la lógica para el juego 'Guess the Number'.
 * Sigue el patrón de los juegos del escape room.
 */
function initGuessNumberGame(roomName, stageName, winToken) {
    // --- Referencias al DOM ---
    const guessInput = document.getElementById('guess-input');
    const guessButton = document.getElementById('guess-button');
    const messageEl = document.getElementById('message');
    const attemptsLeftEl = document.getElementById('attempts-left');
    const gameContainer = document.getElementById('game-container');

    /**
     * Inicia el juego comunicándose con el backend.
     */
    async function startGame() {
        guessInput.disabled = true;
        guessButton.disabled = true;
        try {
            const response = await fetch('/api/ai/guess_number/start', { method: 'POST' });
            if (!response.ok) throw new Error('Error al iniciar el juego en el servidor.');
            
            const data = await response.json();
            if (data.success) {
                console.log("Conexión con el núcleo establecida.");
                attemptsLeftEl.textContent = data.max_attempts;
                guessInput.disabled = false;
                guessButton.disabled = false;
                guessInput.focus();
                displayMessage("Esperando secuencia...", "neutral");
            }
        } catch (error) {
            console.error(error);
            displayMessage("Error de conexión con el núcleo. Imposible continuar.", "danger");
        }
    }

    /**
     * Envía la suposición del usuario al backend y procesa la respuesta.
     */
    async function handleGuess() {
        const userGuess = guessInput.value;
        if (!userGuess) return; // No enviar si está vacío

        guessButton.disabled = true; // Deshabilita mientras se procesa

        try {
            const response = await fetch('/api/ai/guess_number/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guess: userGuess })
            });
            if (!response.ok) throw new Error('El servidor respondió con un error.');

            const result = await response.json();
            
            displayMessage(result.message, result.status === 'correct' ? 'success' : 'danger');
            attemptsLeftEl.textContent = result.attempts_left;

            if (result.status === 'correct') {
                endGame(true);
            } else if (result.attempts_left <= 0) {
                // Si ya no quedan intentos, el juego termina en derrota
                setTimeout(() => endGame(false), 1500);
            } else {
                triggerGlitch(); // Efecto de fallo
                guessButton.disabled = false; // Rehabilita el botón si el juego continúa
            }

        } catch (error) {
            console.error("Error al verificar la suposición:", error);
            displayMessage("Error de comunicación. Inténtalo de nuevo.", "danger");
            guessButton.disabled = false; // Rehabilita en caso de error
        } finally {
            guessInput.value = '';
            guessInput.focus();
        }
    }
    
    function endGame(didWin) {
        guessInput.disabled = true;
        guessButton.disabled = true;

        if (didWin) {
            // Llama a la función global de game_utils.js para la victoria
            setTimeout(() => submitWin(roomName, stageName, winToken), 2000);
        } else {
            // Llama a la función global de game_utils.js para la derrota
            const message = "Te quedaste sin intentos. El núcleo ha bloqueado el acceso.";
            failGame(message, roomName);
        }
    }
    
    // --- Funciones de UI ---
    function displayMessage(text, type) {
        messageEl.textContent = text;
        messageEl.className = `message-text text-${type}`;
    }

    function triggerGlitch() {
        gameContainer.classList.add('glitch');
        setTimeout(() => {
            gameContainer.classList.remove('glitch');
        }, 500);
    }

    // --- Event Listeners ---
    guessButton.addEventListener('click', handleGuess);
    guessInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') handleGuess();
    });

    // Iniciar el juego
    startGame();
}