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
    // --- Referencias al DOM (sin cambios) ---
    const gameImage = document.getElementById('game-image');
    const livesDisplay = document.getElementById('lives-display');
    const scoreDisplay = document.getElementById('score-display');
    const btnReal = document.getElementById('btn-real');
    const btnIA = document.getElementById('btn-ia');
    const feedbackOverlay = document.getElementById('feedback-overlay');

    // --- Configuración del Juego (sin cambios) ---
    const TOTAL_LIVES = 3;
    const IMAGES_TO_WIN = 10;
    const IMAGE_PATH = '/static/img/ai_game/';

    // --- BANCO DE IMÁGENES (Ya corregido) ---
    const imageBank = [
        { file: 'CANDLE.png', type: 'ia' }, { file: 'CAR.png', type: 'ia' },
        { file: 'STREET_ART.png', type: 'ia' }, { file: 'MUSEUM.png', type: 'ia' },
        { file: 'MUSEUM_ROBOT.png', type: 'ia' }, { file: 'FISH.png', type: 'ia' },
        { file: 'PARROT.png', type: 'ia' }, { file: 'HORSE.png', type: 'ia' },
        { file: 'DOG.png', type: 'ia' }, { file: 'CAT.png', type: 'ia' },
        { file: 'BEACH.png', type: 'ia' }, { file: 'TEMPLE.png', type: 'ia' },
        { file: 'CITY.png', type: 'ia' }, { file: 'LAKE.png', type: 'ia' },
        { file: 'STREET.png', type: 'ia' }, { file: 'BOOKS.png', type: 'ia' },
        { file: 'SHOES.png', type: 'ia' }, { file: 'CAKE.png', type: 'ia' },
        { file: 'COFEE.png', type: 'ia' }, { file: 'FOOD.png', type: 'ia' },
        { file: 'GUY.png', type: 'ia' }, { file: 'KID.png', type: 'ia' },
        { file: 'BEACH_COUPLE.png', type: 'ia' }, { file: 'OLD_MAN.png', type: 'ia' },
        { file: 'WOMAN.png', type: 'ia' }, { file: 'ART_SHOW.jpg', type: 'real' },
        { file: 'BOOOKS.jpg', type: 'real' }, { file: 'ESTAMADREQUENOSECOMOSELLAMA.jpg', type: 'real' },
        { file: 'HAPPY_MAN.jpg', type: 'real' }, { file: 'KIDS.jpg', type: 'real' },
        { file: 'OWL.jpg', type: 'real' }, { file: 'CAR_ADVENTURE.jpg', type: 'real' },
        { file: 'COOKIES.jpg', type: 'real' }, { file: 'FOOOD.jpg', type: 'real' },
        { file: 'FOOOOD.jpg', type: 'real' }, { file: 'ART.jpg', type: 'real' },
        { file: 'BIRD.jpg', type: 'real' }, { file: 'KISINGCOUPLE.jpg', type: 'real' },
        { file: 'PAINTING_MAN.jpg', type: 'real' }, { file: 'SHOEES.jpg', type: 'real' },
        { file: 'CAMERAMAN.jpg', type: 'real' }, { file: 'GIRL.jpg', type: 'real' },
        { file: 'PELICANO.jpg', type: 'real' }, { file: 'ZORRO.jpg', type: 'real' },
        { file: 'CALLE.jpg', type: 'real' }, { file: 'VELAS.jpg', type: 'real' },
        { file: 'TEMPLO.jpg', type: 'real' }, { file: 'BEACHMAN.jpg', type: 'real' },
        { file: 'WOW.jpg', type: 'real' }, { file: 'BOAT.jpg', type: 'real' }
    ];

    let lives, score, currentQuestionSet, currentImage, isGameActive;

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function startGame() {
        lives = TOTAL_LIVES;
        score = 0;
        isGameActive = true;
        currentQuestionSet = shuffle([...imageBank]).slice(0, IMAGES_TO_WIN);
        updateLivesUI();
        loadNextImage();
    }

    /** Carga la siguiente imagen o finaliza el juego si es necesario */
    function loadNextImage() {
        updateScoreUI();

        if (score >= IMAGES_TO_WIN) {
            endGame(true);
            return;
        }

        // --- CORRECCIÓN CLAVE ---
        // Comprueba si se acabaron las preguntas. Si es así, el jugador ya no puede ganar.
        // Esto es una condición de derrota, porque es imposible alcanzar los 10 puntos.
        if (currentQuestionSet.length === 0) {
            endGame(false, "No has alcanzado los 10 aciertos. La IA te ha engañado.");
            return;
        }

        currentImage = currentQuestionSet.pop();
        currentImage.type = currentImage.type.trim();
        gameImage.src = IMAGE_PATH + currentImage.file;
        btnReal.disabled = false;
        btnIA.disabled = false;
    }

    /** Procesa la respuesta del jugador */
    function handleAnswer(guess) {
        if (!isGameActive) return;

        btnReal.disabled = true;
        btnIA.disabled = true;

        const isCorrect = (guess === currentImage.type);

        if (isCorrect) {
            score++;
            showFeedback(true);
        } else {
            lives--;
            updateLivesUI();
            showFeedback(false);
        }

        setTimeout(() => {
            feedbackOverlay.style.display = 'none';

            // La única condición de derrota aquí es quedarse sin vidas.
            // El otro caso (quedarse sin preguntas) se maneja en loadNextImage.
            if (lives <= 0) {
                endGame(false); // Usa el mensaje por defecto de "sin vidas"
            } else {
                loadNextImage();
            }
        }, 1200);
    }

    // --- Resto de las funciones (con una mejora en endGame) ---

    function showFeedback(isCorrect) {
        if (isCorrect) {
            feedbackOverlay.textContent = '✔️ Correcto';
            feedbackOverlay.style.color = 'var(--correct)';
        } else {
            feedbackOverlay.textContent = '❌ Incorrecto';
            feedbackOverlay.style.color = 'var(--incorrect)';
        }
        feedbackOverlay.style.display = 'flex';
    }

    function updateLivesUI() {
        livesDisplay.textContent = '❤️'.repeat(lives) + '🖤'.repeat(TOTAL_LIVES - lives);
    }

    function updateScoreUI() {
        scoreDisplay.textContent = `Correctas: ${score} / ${IMAGES_TO_WIN}`;
    }

    /** Finaliza el juego con un mensaje opcional */
    function endGame(didWin, reason = null) {
        if (!isGameActive) return;
        isGameActive = false;

        if (didWin) {
            feedbackOverlay.textContent = '🏆 ¡GANASTE!';
            feedbackOverlay.style.color = 'gold';
            feedbackOverlay.style.display = 'flex';
            setTimeout(() => submitWin(roomName, stageName, winToken), 2000);
        } else {
            // --- MEJORA ---
            // Usa el mensaje personalizado si existe, si no, usa el de por defecto.
            const message = reason || "Te has quedado sin vidas. La IA te ha engañado.";
            failGame(message, roomName);
        }
    }

    btnReal.addEventListener('click', () => handleAnswer('real'));
    btnIA.addEventListener('click', () => handleAnswer('ia'));

    startGame();
}
