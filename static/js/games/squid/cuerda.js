/**
 * Juego 3: Tira y Afloja (Acertijo)
 */
function initCuerdaGame(roomName, stageName, winToken) {
    const ropeMarker = document.getElementById('rope-marker');
    const questionTitle = document.getElementById('question-title');
    const optionsButtons = document.getElementById('options-buttons');
    const gameResult = document.getElementById('game-result');
    let ropePosition = 50;
    let gameActive = true;
    let opponentPullInterval;
    const questions = [
        { q: "¿Cuánto es 8 x 7?", a: "56", o: ["48", "54", "64"] },
        { q: "¿Qué animal maúlla?", a: "Gato", o: ["Perro", "Pato", "León"] },
        { q: "¿Cuál es la capital de Italia?", a: "Roma", o: ["Madrid", "París", "Lisboa"] },
        { q: "¿De qué color es el cielo en un día despejado?", a: "Azul", o: ["Verde", "Rojo", "Amarillo"] },
        { q: "¿Quién es el autor de 'El Quijote'?", a: "Miguel de Cervantes", o: ["García Márquez", "Shakespeare", "Góngora"] },
        { q: "¿En qué año llegó Cristóbal Colón a América?", a: "1492", o: ["1592", "1488", "1500"] },
        { q: "¿Cuál es la capital de Australia?", a: "Canberra", o: ["Sídney", "Melbourne", "Perth"] },
        { q: "¿Quién pintó la Mona Lisa?", a: "Leonardo da Vinci", o: ["Vincent van Gogh", "Pablo Picasso", "Miguel Ángel"] },
        { q: "¿Cuál es el océano más grande del mundo?", a: "Océano Pacífico", o: ["Océano Atlántico", "Océano Índico", "Océano Ártico"] },
        { q: "¿Qué civilización construyó Machu Picchu?", a: "Inca", o: ["Azteca", "Maya", "Egipcia"] }
    ];

    function startGame() {
        gameActive = true;
        loadNextQuestion();
        opponentPullInterval = setInterval(() => {
            if (!gameActive) return;
            ropePosition -= 1.2;
            updateRopeUI();
            checkWinCondition();
        }, 600);
    }

    function updateRopeUI() {
        ropeMarker.style.left = `${ropePosition}%`;
    }

    function loadNextQuestion() {
        if (!gameActive) return;
        const questionIndex = Math.floor(Math.random() * questions.length);
        const currentQuestion = questions[questionIndex];
        questionTitle.textContent = currentQuestion.q;
        optionsButtons.innerHTML = '';
        const options = [...currentQuestion.o, currentQuestion.a];
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'btn btn-outline-light btn-lg';
            button.textContent = option;
            button.onclick = () => handleAnswer(option, currentQuestion.a);
            optionsButtons.appendChild(button);
        });
    }

    function handleAnswer(selectedAnswer, correctAnswer) {
        if (!gameActive) return;
        if (selectedAnswer === correctAnswer) {
            ropePosition += 10;
        } else {
            ropePosition -= 8;
        }
        updateRopeUI();
        checkWinCondition();
        loadNextQuestion();
    }

    function checkWinCondition() {
        if (ropePosition >= 95) {
            endGame(true);
        } else if (ropePosition <= 5) {
            endGame(false);
        }
    }

    function endGame(playerWon) {
        if (!gameActive) return;
        gameActive = false;
        clearInterval(opponentPullInterval);
        optionsButtons.innerHTML = '';
        if (playerWon) {
            gameResult.textContent = "¡VICTORIA! Tu equipo ha ganado.";
            gameResult.className = 'text-success fw-bold';
            questionTitle.textContent = '¡Ganaste!';
            ropePosition = 100;
            updateRopeUI();
            setTimeout(() => submitWin(roomName, stageName, winToken), 1500);
        } else {
            gameResult.textContent = "DERROTA. El oponente fue más fuerte.";
            gameResult.className = 'text-danger fw-bold';
            questionTitle.textContent = '¡Perdiste!';
            ropePosition = 0;
            updateRopeUI();
            failGame("Tu equipo fue arrastrado en el Tira y Afloja.", roomName);
        }
    }

    startGame();
}
