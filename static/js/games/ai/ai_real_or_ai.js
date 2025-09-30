/**
 * =============================================================
 * Juego 1 (Sala AI): ¿Real o IA?
 * =============================================================
 *
 * NOTA DE MANTENIBILIDAD:
 * El banco de imágenes (`imageBank`) está hardcodeado en este archivo.
 * Para facilitar la actualización y evitar que los jugadores vean las respuestas
 * en el código fuente, considera cargar esta lista desde el backend.
 */
function initRealOrAIGame(roomName, stageName, winToken) {
    // --- Referencias al DOM ---
    const gameImage = document.getElementById('game-image');
    const scoreDisplay = document.getElementById('score-display');
    const btnReal = document.getElementById('btn-real');
    const btnIA = document.getElementById('btn-ia');
    const feedbackOverlay = document.getElementById('feedback-overlay');

    // --- Configuración del Juego ---
    const IMAGES_TO_WIN = 8; // Objetivo de 8 aciertos
    const IMAGE_PATH = '/static/img/ai_game/';

    // --- Estado del Juego ---
    let isGameActive = false;

    async function startGame() {
        isGameActive = true;
        setButtonsDisabled(true);

        try {
            const response = await fetch('/api/ai/real_or_ai/start', { method: 'POST' });
            if (!response.ok) throw new Error('Failed to start game');
            const data = await response.json();

            updateScoreUI(data.score);
            gameImage.src = IMAGE_PATH + data.image_file;
            setButtonsDisabled(false);

        } catch (error) {
            console.error("Error starting game:", error);
            feedbackOverlay.textContent = 'Error al iniciar';
            feedbackOverlay.style.color = 'var(--incorrect)';
            feedbackOverlay.style.display = 'flex';
        }
    }

    function setButtonsDisabled(disabled) {
        btnReal.disabled = disabled;
        btnIA.disabled = disabled;
    }

    async function handleAnswer(guess) {
        if (!isGameActive) return;

        setButtonsDisabled(true);

        try {
            const response = await fetch('/api/ai/real_or_ai/guess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guess: guess })
            });
            if (!response.ok) throw new Error('Failed to submit guess');

            const data = await response.json();

            showFeedback(data.correct);
            updateScoreUI(data.new_score);

            setTimeout(() => {
                feedbackOverlay.style.display = 'none';

                if (data.game_over) {
                    endGame(data.win);
                } else {
                    gameImage.src = IMAGE_PATH + data.next_image_file;
                    setButtonsDisabled(false);
                }
            }, 1200);

        } catch (error) {
            console.error("Error submitting guess:", error);
            feedbackOverlay.textContent = 'Error de conexión';
            feedbackOverlay.style.display = 'flex';
            setButtonsDisabled(false);
        }
    }

    function showFeedback(isCorrect) {
        feedbackOverlay.textContent = isCorrect ? '✔️ Correcto' : '❌ Incorrecto';
        feedbackOverlay.style.color = isCorrect ? 'var(--correct)' : 'var(--incorrect)';
        feedbackOverlay.style.display = 'flex';
    }

    function updateScoreUI(currentScore) {
        scoreDisplay.textContent = `Correctas: ${currentScore} / ${IMAGES_TO_WIN}`;
    }

    function endGame(didWin) {
        isGameActive = false;
        setButtonsDisabled(true);

        if (didWin) {
            feedbackOverlay.textContent = '🏆 ¡GANASTE!';
            feedbackOverlay.style.color = 'gold';
            feedbackOverlay.style.display = 'flex';
            setTimeout(() => submitWin(roomName, stageName, winToken), 2000);
        } else {
            // Este caso solo ocurriría si nos quedamos sin imágenes, lo cual es improbable.
            const message = "Se ha producido un error inesperado. No has podido completar la prueba.";
            failGame(message, roomName);
        }
    }

    btnReal.addEventListener('click', () => handleAnswer('real'));
    btnIA.addEventListener('click', () => handleAnswer('ia'));

    startGame();
}
