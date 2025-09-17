/**
 * =============================================================
 * Juego 5: Tira y Afloja Minero
 * =============================================================
 */
function initTugOfWarGame(roomName, stageName, winToken) {
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
            setTimeout(() => submitWin(roomName, stageName, winToken), 1500);
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
