/**
 * =============================================================
 * Juego 2 (Sala AI): Protocolo de Verificación Humana (CAPTCHA)
 * =============================================================
 *
 * NOTA DE MANTENIBILIDAD:
 * El banco de puzzles (`puzzleBank`) está hardcodeado en este archivo.
 * Para facilitar la actualización y evitar que los jugadores vean las respuestas
 * en el código fuente, considera cargar esta lista desde el backend.
 */
function initCaptchaGame(roomName, stageName, winToken) {
    // --- Referencias al DOM ---
    const progressBarDots = document.querySelectorAll('.progress-dot');
    const promptEl = document.getElementById('prompt');
    const imageGrid = document.getElementById('image-grid');
    const submitBtn = document.getElementById('submit-btn');
    const feedbackMessage = document.getElementById('feedback-message');

    // --- Configuración del Juego ---
    const STAGES_TO_WIN = 3;
    const IMAGE_PATH = '/static/img/captcha_game/';

    // --- BANCO DE PUZZLES ---
    // ¡IMPORTANTE! Rellena esto con tus propios puzzles.
    // 'images' debe tener 9 nombres de archivo.
    // 'correctIndices' son los índices (0-8) de las respuestas correctas.
    const puzzleBank = [
        {
            prompt: "Selecciona la imagen que contiene un error de generación de IA.",
            images: ['hand_normal_1.jpg', 'hand_6_fingers.jpg', 'hand_normal_2.jpg', 'face_normal_1.jpg', 'face_normal_2.jpg', 'face_normal_3.jpg', 'text_normal.jpg', 'text_weird.jpg', 'text_normal_2.jpg'],
            correctIndices: [1, 7]
        },
        {
            prompt: "Selecciona la imagen que evoca 'tranquilidad'.",
            images: ['storm.jpg', 'traffic_jam.jpg', 'protest.jpg', 'serene_lake.jpg', 'warzone.jpg', 'factory.jpg', 'library.jpg', 'beach_sunset.jpg', 'heavy_metal_concert.jpg'],
            correctIndices: [3, 6, 7]
        },
        {
            prompt: "Selecciona el objeto que no pertenece al grupo.",
            images: ['hammer.jpg', 'screwdriver.jpg', 'wrench.jpg', 'saw.jpg', 'apple.jpg', 'drill.jpg', 'pliers.jpg', 'tape_measure.jpg', 'axe.jpg'],
            correctIndices: [4]
        },
        // ... Añade más puzzles aquí para tener variedad
    ];

    // --- Estado del Juego ---
    let completedStages = 0;
    let currentPuzzle;
    let selectedIndices = [];
    let availablePuzzles = [];

    /** Baraja un array */
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /** Inicia o reinicia el juego */
    function startGame() {
        completedStages = 0;
        availablePuzzles = shuffle([...puzzleBank]);
        updateProgressUI();
        loadNextPuzzle();
    }

    /** Carga el siguiente puzzle en la UI */
    function loadNextPuzzle() {
        selectedIndices = [];
        feedbackMessage.textContent = '';
        submitBtn.disabled = false;

        if (availablePuzzles.length === 0) {
            // Si nos quedamos sin puzzles, reiniciamos la lista
            availablePuzzles = shuffle([...puzzleBank]);
        }
        currentPuzzle = availablePuzzles.pop();

        promptEl.textContent = currentPuzzle.prompt;
        imageGrid.innerHTML = '';
        currentPuzzle.images.forEach((imgFile, index) => {
            const img = document.createElement('img');
            img.src = IMAGE_PATH + imgFile;
            img.classList.add('grid-image');
            img.dataset.index = index;
            img.onclick = () => handleImageClick(img, index);
            imageGrid.appendChild(img);
        });
    }

    /** Maneja el clic en una imagen */
    function handleImageClick(imgElement, index) {
        const selectedIndex = selectedIndices.indexOf(index);
        if (selectedIndex > -1) {
            // Si ya está seleccionada, la deseleccionamos
            selectedIndices.splice(selectedIndex, 1);
            imgElement.classList.remove('selected');
        } else {
            // Si no, la añadimos a la selección
            selectedIndices.push(index);
            imgElement.classList.add('selected');
        }
    }

    /** Comprueba la respuesta del jugador */
    function checkAnswer() {
        submitBtn.disabled = true;
        const correct = currentPuzzle.correctIndices;

        // Comparamos si los arrays son iguales, sin importar el orden
        const isCorrect = correct.length === selectedIndices.length &&
                          correct.every(index => selectedIndices.includes(index));

        if (isCorrect) {
            completedStages++;
            updateProgressUI();
            showFeedback('Verificación aceptada. Procediendo al siguiente nivel...', true);
            setTimeout(() => {
                if (completedStages >= STAGES_TO_WIN) {
                    endGame(true);
                } else {
                    loadNextPuzzle();
                }
            }, 1500);
        } else {
            showFeedback('Anomalía detectada. Reiniciando protocolo de verificación...', false);
            setTimeout(loadNextPuzzle, 1500);
        }
    }

    /** Muestra un mensaje de feedback */
    function showFeedback(message, isSuccess) {
        feedbackMessage.textContent = message;
        feedbackMessage.style.color = isSuccess ? 'var(--correct)' : 'var(--incorrect)';
    }

    /** Actualiza los puntos de progreso */
    function updateProgressUI() {
        progressBarDots.forEach((dot, index) => {
            if (index < completedStages) {
                dot.classList.add('completed');
            } else {
                dot.classList.remove('completed');
            }
        });
    }

    /** Finaliza el juego */
    function endGame(didWin) {
        if (didWin) {
            promptEl.textContent = "Verificación Humana Completa";
            feedbackMessage.textContent = "Acceso concedido.";
            feedbackMessage.style.color = 'var(--correct)';
            imageGrid.innerHTML = '';
            submitBtn.style.display = 'none';
            setTimeout(() => submitWin(roomName, stageName, winToken), 2000);
        }
        // No hay condición de derrota explícita, el jugador puede seguir intentando
    }

    // --- Event Listeners ---
    submitBtn.addEventListener('click', checkAnswer);

    // --- Iniciar el juego ---
    startGame();
}
