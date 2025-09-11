/**
 * =============================================================
 * Funciones Auxiliares Globales para el Escape Room
 * COPIA ESTAS FUNCIONES EN CADA NUEVO ARCHIVO JS DE MINIJUEGO
 * =============================================================
 */

/**
 * Envía una señal de victoria al backend.
 * @param {string} roomName - El nombre de la sala actual.
 * @param {string} stageName - El nombre de la etapa actual.
 */
function submitWin(roomName, stageName) {
    console.log(`Victoria en: ${roomName}/${stageName}. Enviando al servidor...`);
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/win/${roomName}/${stageName}`;
    document.body.appendChild(form);
    form.submit();
}

/**
 * Gestiona una derrota y redirige al INICIO de la sala correcta.
 * @param {string} message - El mensaje que se mostrará al jugador.
 * @param {string} roomName - El nombre de la sala que se debe reiniciar.
 */
function failGame(message, roomName) {
    alert(message + "\n\nSerás redirigido para que puedas intentarlo de nuevo.");
    window.location.href = `/start/${roomName}`;
}


/**
 * =============================================================
 * Juego 1 (Sala AI): ¿Real o IA?
 * =============================================================
 */
// EN static/js/ai.js - REEMPLAZA ESTA FUNCIÓN COMPLETA

// EN static/js/ai.js - REEMPLAZA ESTA FUNCIÓN COMPLETA

function initRealOrAIGame(roomName, stageName) {
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
            setTimeout(() => submitWin(roomName, stageName), 2000);
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

/**
 * =============================================================
 * Juego 2 (Sala AI): Protocolo de Verificación Humana (CAPTCHA)
 * =============================================================
 */
function initCaptchaGame(roomName, stageName) {
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
    // 'correct_indices' son los índices (0-8) de las respuestas correctas.
    const puzzleBank = [
        {
            prompt: "Selecciona la imagen que contiene un error de generación de IA.",
            images: ['hand_normal_1.jpg', 'hand_6_fingers.jpg', 'hand_normal_2.jpg', 'face_normal_1.jpg', 'face_normal_2.jpg', 'face_normal_3.jpg', 'text_normal.jpg', 'text_weird.jpg', 'text_normal_2.jpg'],
            correct_indices: [1, 7]
        },
        {
            prompt: "Selecciona la imagen que evoca 'tranquilidad'.",
            images: ['storm.jpg', 'traffic_jam.jpg', 'protest.jpg', 'serene_lake.jpg', 'warzone.jpg', 'factory.jpg', 'library.jpg', 'beach_sunset.jpg', 'heavy_metal_concert.jpg'],
            correct_indices: [3, 6, 7]
        },
        {
            prompt: "Selecciona el objeto que no pertenece al grupo.",
            images: ['hammer.jpg', 'screwdriver.jpg', 'wrench.jpg', 'saw.jpg', 'apple.jpg', 'drill.jpg', 'pliers.jpg', 'tape_measure.jpg', 'axe.jpg'],
            correct_indices: [4]
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
        const correct = currentPuzzle.correct_indices;
        
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
            setTimeout(() => submitWin(roomName, stageName), 2000);
        }
        // No hay condición de derrota explícita, el jugador puede seguir intentando
    }

    // --- Event Listeners ---
    submitBtn.addEventListener('click', checkAnswer);

    // --- Iniciar el juego ---
    startGame();
}



/**
 * =============================================================
 * Juego 3 (Sala AI): Test de Empatía Inversa (Chatbot)
 * =============================================================
 */
function initChatbotGame(roomName, stageName) {
    // --- Referencias al DOM ---
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const progressBarDots = document.querySelectorAll('.progress-dot');

    // --- Estado del Juego ---
    let conversationHistory = [];
    let completedStages = 0;
    let isAITurn = false;

    /** Añade un mensaje a la interfaz del chat */
    function addMessageToUI(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);

        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.textContent = text;
        
        messageDiv.appendChild(bubble);
        chatWindow.appendChild(messageDiv);
        
        // Auto-scroll hacia el último mensaje
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    /** Envía la conversación al backend y obtiene la respuesta de la IA */
    async function getAIResponse() {
        isAITurn = true;
        sendBtn.disabled = true;
        userInput.disabled = true;
        addMessageToUI('ai', 'Procesando...');

        try {
            const response = await fetch('/api/gemini_chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history: conversationHistory })
            });
            if (!response.ok) throw new Error('Error en la comunicación con la IA.');
            
            const data = await response.json();
            const aiText = data.response;

            // Quitar el mensaje de "Procesando..."
            chatWindow.removeChild(chatWindow.lastChild); 
            
            conversationHistory.push({ role: 'model', parts: [{ text: aiText }] });
            addMessageToUI('ai', aiText);

            // Comprobar si se completó una etapa
            if (aiText.includes("Análisis completo")) {
                // Actualizamos la UI para que el jugador vea el progreso
                completedStages = 1; 
                updateProgressUI();
            
                // Esperamos 1 segundo antes de terminar el juego
                setTimeout(() => {
                    endGame(true);
                }, 10000); // el tiempo está en milisegundos
            }
            

        } catch (error) {
            console.error(error);
            addMessageToUI('ai', 'Error: No se pudo establecer la conexión. Inténtalo de nuevo.');
        } finally {
            isAITurn = false;
            sendBtn.disabled = false;
            userInput.disabled = false;
            userInput.focus();
        }
    }

    /** Maneja el envío del mensaje del usuario */
    function handleUserSubmit() {
        const userText = userInput.value.trim();
        if (userText && !isAITurn) {
            userInput.value = '';
            conversationHistory.push({ role: 'user', parts: [{ text: userText }] });
            addMessageToUI('user', userText);
            getAIResponse();
        }
    }

    /** Actualiza la barra de progreso */
    function updateProgressUI() {
        progressBarDots.forEach((dot, index) => {
            if (index < completedStages) dot.classList.add('completed');
        });
    }

    /** Finaliza el juego */
    function endGame(didWin) {
        userInput.disabled = true;
        sendBtn.disabled = true;
        if (didWin) {
            setTimeout(() => {
                addMessageToUI('ai', 'Verificación de empatía exitosa. Protocolos de seguridad desactivados.');
                submitWin(roomName, stageName);
            }, 1500);
        }
        // No hay condición de derrota, el jugador puede seguir intentándolo.
    }
    
    /** Inicia la conversación */
    function startGame() {
        // La IA inicia la conversación
        getAIResponse();
    }

    // --- Event Listeners ---
    sendBtn.addEventListener('click', handleUserSubmit);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleUserSubmit();
    });

    startGame();
}
// EN static/js/ai.js - REEMPLAZA LA FUNCIÓN ANTIGUA CON ESTA VERSIÓN COMPLETA Y FINAL

function initStaticApocalypseMap(roomName, stageName) {
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
    const IMAGE_PATH = '/static/img/captcha_game/';
    const PUZZLE_BANK = [
        { type: 'semantic', prompt: "Sistema: Selecciona la imagen que representa 'caos'.", images: ['serene_lake.jpg', 'library.jpg', 'traffic_jam.jpg', 'beach_sunset.jpg', 'protest.jpg', 'storm.jpg', 'zen_garden.png', 'empty_room.png', 'sleeping_cat.png'], correctIndices: [2, 4, 5] },
        { type: 'odd-one-out', prompt: "Sistema: Identifica el artefacto anómalo.", images: ['hammer.jpg', 'wrench.jpg', 'apple.jpg', 'saw.jpg', 'screwdriver.jpg', 'axe.jpg', 'drill.jpg', 'pliers.jpg', 'tape_measure.jpg'], correctIndex: 2 },
        { type: 'ai-error', prompt: "Sistema: Detecta la corrupción de datos (error de IA).", images: ['hand_normal_1.jpg', 'hand_6_fingers.jpg', 'face_normal_1.jpg', 'face_normal_2.jpg', 'text_normal.jpg', 'hand_normal_2.jpg', 'face_normal_3.jpg', 'text_weird.jpg', 'cat_normal.png'], correctIndices: [1, 7] }
    ];

    // --- Estado del Juego ---
    let player, map, doors, puzzles, traps, currentCaptcha, selectedCaptchaIndices;
    const unlockedKeys = new Set();
    const staticMap = [ [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                        [1,1,1,0,0,5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                        [1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                        [1,0,1,0,0,0,1,1,1,1,5,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                        [1,0,1,1,1,0,1,1,1,1,0,0,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                        [1,0,0,0,0,0,1,1,4,1,1,1,0,0,0,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                        [1,4,0,1,0,0,2,0,0,0,0,0,0,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                        [1,1,1,1,4,0,1,1,0,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                        [1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,4,0,0,0,4,1,1,1,1,1,1,1,4,0,1,1,1,1],
                        [1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,4,0,1,1,1,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,1,1],
                        [1,1,1,1,1,1,1,0,0,0,1,1,1,1,0,0,0,1,1,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
                        [1,1,1,4,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,5,0,0,1,1],
                        [1,1,1,0,0,0,1,0,0,0,1,1,1,1,0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,1,1],
                        [1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,4,0,0,0,4,1,1,1,1,1,1,1,0,4,1,1,1,1],
                        [1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                        [1,1,1,1,0,0,0,1,0,0,0,4,1,1,1,0,1,1,1,1,1,0,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                        [1,1,1,1,0,5,0,2,0,0,0,0,1,1,1,0,1,1,1,1,1,0,1,1,1,3,0,1,1,1,1,1,1,1,1,1,1,1],
                        [1,1,1,1,0,0,0,1,0,0,0,0,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1],
                        [1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1],
                        [1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,2,0,0,1,1,1,1,1,1,1,1,1,1,1],
                        [1,1,1,1,1,1,1,1,0,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,4,1,1,1,1,1,1,1,1,1,1,1],
                        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]];
                        
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
        const randomIndex = Math.floor(Math.random() * PUZZLE_BANK.length);
        return PUZZLE_BANK[randomIndex];
    }
    
    function setupLevel() {
        if (PUZZLE_BANK.length < 3) { console.error("Error: PUZZLE_BANK necesita al menos 3 puzzles."); return; }
        map = staticMap;
        player = { x: 1, y: 2, lives: 4 };
        doors = {};
        puzzles = {};
        traps = {}; // Inicializa el objeto de trampas
        puzzles[coordKey(5, 1)] = { puzzle: getRandomPuzzle(), doorKey: coordKey(6, 6), solved: false, name: "Alpha" };
        puzzles[coordKey(33, 11)] = { puzzle: getRandomPuzzle(), doorKey: coordKey(12, 4), solved: false, name: "Beta" };
        puzzles[coordKey(10, 3)] = { puzzle: getRandomPuzzle(), doorKey: coordKey(7, 16), solved: false, name: "Gamma" };
        puzzles[coordKey(5, 16)] = { puzzle: getRandomPuzzle(), doorKey: coordKey(24, 19), solved: false, name: "Exit" };
        
        Object.values(puzzles).forEach(p => { doors[p.doorKey] = { open: false }; });
        log('Sistema: Sobreviviente detectado. Accede al búnker de seguridad.');
    }
    
    function render() {
        mapEl.innerHTML = '';
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
                    if (traps[key] && traps[key].triggered) {
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
                if (!isVisible(x, y)) {
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
        } else if (tileType === 4) {
            const trapKey = key;
            if (!traps[trapKey] || !traps[trapKey].triggered) {
                traps[trapKey] = { triggered: true };
                player.lives--;
                log('¡Peligro! Has activado una contramedida de la IA. Vidas -1.');
                if (player.lives <= 0) endGame(false);
            }
        } else if (tileType === 5) {
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
        const correct = Array.isArray(currentCaptcha.puzzle.correctIndices) ? currentCaptcha.puzzle.correctIndices : [currentCaptcha.puzzle.correctIndex];
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
        if (didWin) {
            setTimeout(() => submitWin(roomName, stageName), 1500);
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
}