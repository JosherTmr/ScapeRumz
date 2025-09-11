// =============================================================
// Funciones Auxiliares Globales para la Sala "Calamar"
// =============================================================

/**
 * Notifica al servidor que el jugador ha ganado la etapa actual.
 * Esto actualiza la sesión y redirige al siguiente nivel.
 * @param {string} roomName - El nombre de la sala (ej: 'calamar').
 * @param {string} stageName - El nombre de la etapa actual (ej: 'luzroja').
 */
function submitWin(roomName, stageName) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/win/${roomName}/${stageName}`;
    document.body.appendChild(form);
    form.submit();
}

/**
 * Muestra un mensaje de fallo y recarga la página actual.
 * Esto permite al jugador reintentar el minijuego actual sin perder el progreso general.
 * @param {string} message - El mensaje de error a mostrar.
 */
function failGame(message) {
    alert(`¡Has sido eliminado! ${message}\n\nPodrás intentarlo de nuevo.`);
    // Se usa un pequeño retardo para que el jugador pueda leer el mensaje.
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}


// =============================================================
// Lógica de Minijuegos
// =============================================================

/**
 * Juego 1: Luz Roja, Luz Verde
 */
function initLuzRojaGame(roomName, stageName) {
    const trafficLight = document.getElementById('traffic-light');
    const runButton = document.getElementById('run-button');
    const progressBar = document.getElementById('progress-bar');
    const progressDisplay = document.getElementById('progress-display');
    const timerDisplay = document.getElementById('timer-display');
    const gameMessage = document.getElementById('game-message');

    let progress = 0;
    let timeLeft = 30;
    let lightState = 'red';
    let gameActive = true;
    let gameLoopTimeout;
    let countdownInterval;

    function startGame() {
        gameActive = true;
        runButton.disabled = false;
        gameMessage.textContent = '';
        progress = 0;
        updateProgress();
        
        countdownInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `Tiempo: ${timeLeft}s`;
            if (timeLeft <= 0) {
                endGame(false, '¡Se acabó el tiempo!');
            }
        }, 1000);

        changeToGreen();
    }

    function changeToGreen() {
        if (!gameActive) return;
        lightState = 'green';
        trafficLight.style.backgroundColor = '#28a745';
        trafficLight.style.boxShadow = '0 0 25px #28a745';
        const greenDuration = Math.random() * 2000 + 1500;
        gameLoopTimeout = setTimeout(changeToYellow, greenDuration);
    }

    function changeToYellow() {
        if (!gameActive) return;
        lightState = 'yellow';
        trafficLight.style.backgroundColor = '#ffc107';
        trafficLight.style.boxShadow = '0 0 25px #ffc107';
        gameLoopTimeout = setTimeout(changeToRed, 750);
    }

    function changeToRed() {
        if (!gameActive) return;
        lightState = 'red';
        trafficLight.style.backgroundColor = '#dc3545';
        trafficLight.style.boxShadow = '0 0 25px #dc3545';
        const redDuration = Math.random() * 2000 + 1000;
        gameLoopTimeout = setTimeout(changeToGreen, redDuration);
    }

    function updateProgress() {
        progress = Math.min(progress + 4, 100); 
        progressBar.style.width = `${progress}%`;
        progressDisplay.textContent = `${progress}%`;
        if (progress >= 100) {
            endGame(true, '¡Llegaste a la meta!');
        }
    }

    runButton.addEventListener('click', () => {
        if (!gameActive) return;
        if (lightState === 'green') {
            updateProgress();
        } else {
            const reason = lightState === 'red' ? '¡Te moviste en luz roja!' : '¡Te moviste en luz amarilla!';
            endGame(false, reason);
        }
    });
    
    function endGame(isWin, message) {
        if (!gameActive) return;
        gameActive = false;
        clearTimeout(gameLoopTimeout);
        clearInterval(countdownInterval);
        runButton.disabled = true;
        gameMessage.textContent = message;

        if (isWin) {
            gameMessage.className = 'text-success';
            trafficLight.style.backgroundColor = '#17a2b8';
            setTimeout(() => submitWin(roomName, stageName), 1500);
        } else {
            gameMessage.className = 'text-danger';
            trafficLight.style.backgroundColor = '#343a40';
            // Llama a la función global de fallo estandarizada.
            failGame(message);
        }
    }
    
    startGame();
}

/**
 * Juego 2: Panal de Azúcar
 */
function initPanalGame(roomName, stageName) {
    const quizContainer = document.getElementById('quiz-container');
    const questionCounter = document.getElementById('question-counter');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const quizFeedback = document.getElementById('quiz-feedback');
    const canvasContainer = document.getElementById('canvas-container');
    const sequenceDisplay = document.getElementById('sequence-display');
    const canvas = document.getElementById('panal-canvas');
    const feedback = document.getElementById('feedback');
    const ctx = canvas.getContext('2d');
    const points = [{x: 200, y: 50}, {x: 350, y: 150}, {x: 300, y: 350}, {x: 100, y: 350}, {x: 50, y: 150}];
    const totalQuestions = 5;
    let usedQuizIndexes = new Set();
    let currentQuestionIndex = 0;
    let correctSequence = [];
    let vertexNumbers = [];
    let nextPointToTrace = 0;
    const quizData = [
        { question: "¿Cuál es la capital de Francia?", options: ["París", "Londres", "Berlín", "Madrid"], answer: "París" },
        { question: "¿Cuál es el planeta más grande de nuestro sistema solar?", options: ["Marte", "Saturno", "Júpiter", "Neptuno"], answer: "Júpiter" },
        { question: "¿Cuál es la montaña más alta del mundo?", options: ["Monte Everest", "K2", "Kangchenjunga", "Makalu"], answer: "Monte Everest" },
        { question: "¿Cuál es el océano más grande de la Tierra?", options: ["Océano Pacífico", "Océano Índico", "Océano Atlántico", "Océano Ártico"], answer: "Océano Pacífico" },
        { question: "¿Quién pintó la Mona Lisa?", options: ["Pablo Picasso", "Vincent van Gogh", "Leonardo da Vinci", "Miguel Ángel"], answer: "Leonardo da Vinci" },
        { question: "¿Qué planeta es conocido como el Planeta Rojo?", options: ["Marte", "Venus", "Mercurio", "Urano"], answer: "Marte" },
        { question: "¿Cuál es la capital de Japón?", options: ["Tokio", "Kioto", "Osaka", "Nagoya"], answer: "Tokio" },
        { question: "¿Quién escribió 'Romeo y Julieta'?", options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "León Tolstói"], answer: "William Shakespeare" },
        { question: "¿En qué continente se encuentra el Desierto del Sahara?", options: ["Asia", "África", "Australia", "Europa"], answer: "África" },
        { question: "¿Cuántos lados tiene un hexágono?", options: ["Cinco", "Seis", "Siete", "Ocho"], answer: "Seis" }
    ];

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function loadQuestion() {
        if (currentQuestionIndex >= totalQuestions) {
            startTracingPhase();
            return;
        }
        questionCounter.textContent = `Pregunta ${currentQuestionIndex + 1} de ${totalQuestions}`;
        let questionIndex;
        do {
            questionIndex = Math.floor(Math.random() * quizData.length);
        } while (usedQuizIndexes.has(questionIndex));
        usedQuizIndexes.add(questionIndex);
        const currentQuiz = quizData[questionIndex];
        questionText.textContent = currentQuiz.question;
        optionsContainer.innerHTML = '';
        let availableNumbers = [1, 2, 3, 4];
        shuffleArray(availableNumbers);
        const correctAnswerNumber = availableNumbers.pop();
        correctSequence.push(correctAnswerNumber);
        const optionsWithNumbers = [{ text: currentQuiz.answer, number: correctAnswerNumber }];
        const wrongOptions = currentQuiz.options.filter(opt => opt !== currentQuiz.answer);
        shuffleArray(wrongOptions);
        for(let i=0; i<3; i++){
            optionsWithNumbers.push({ text: wrongOptions[i], number: availableNumbers[i] });
        }
        shuffleArray(optionsWithNumbers);
        optionsWithNumbers.forEach(opt => {
            const button = document.createElement('button');
            button.className = 'list-group-item list-group-item-action list-group-item-primary';
            button.textContent = `${opt.number}. ${opt.text}`;
            button.onclick = () => checkAnswer(opt.text === currentQuiz.answer, opt.number);
            optionsContainer.appendChild(button);
        });
    }

    function checkAnswer(isCorrect, number) {
        if (isCorrect) {
            quizFeedback.textContent = `¡Correcto! El número es ${number}.`;
            quizFeedback.className = 'text-success';
            currentQuestionIndex++;
            setTimeout(loadQuestion, 1500);
        } else {
            quizFeedback.textContent = '¡Incorrecto! El panal se ha roto.';
            quizFeedback.className = 'text-danger';
            failGame('Respuesta incorrecta en el quiz del panal.');
        }
    }
    
    function startTracingPhase() {
        quizContainer.style.display = 'none';
        canvasContainer.style.display = 'block';
        sequenceDisplay.textContent = correctSequence.join(' - ');
        vertexNumbers = [...correctSequence];
        shuffleArray(vertexNumbers);
        drawShape();
    }
    
    function drawShape() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#6f1d1b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        points.forEach((p, index) => {
            const correctIndexOfThisVertex = correctSequence.indexOf(vertexNumbers[index]);
            const isTraced = correctIndexOfThisVertex < nextPointToTrace;
            ctx.fillStyle = isTraced ? '#28a745' : '#495057';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(vertexNumbers[index], p.x, p.y);
        });
    }

    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        points.forEach((p, index) => {
            const distance = Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2));
            if (distance < 25) {
                const clickedNumber = vertexNumbers[index];
                const expectedNumber = correctSequence[nextPointToTrace];
                if (clickedNumber === expectedNumber) {
                    nextPointToTrace++;
                    feedback.textContent = '¡Bien!';
                    feedback.className = 'text-success';
                    drawShape();
                    if (nextPointToTrace === points.length) {
                        feedback.textContent = '¡Forma extraída con éxito!';
                        setTimeout(() => submitWin(roomName, stageName), 1000);
                    }
                } else {
                    feedback.textContent = '¡Secuencia incorrecta! El panal se rompió.';
                    feedback.className = 'text-danger';
                    failGame('Secuencia incorrecta en el panal.');
                }
            }
        });
    });

    loadQuestion();
}

/**
 * Juego 3: Tira y Afloja (Acertijo)
 */
function initCuerdaGame(roomName, stageName) {
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
            setTimeout(() => submitWin(roomName, stageName), 1500);
        } else {
            gameResult.textContent = "DERROTA. El oponente fue más fuerte.";
            gameResult.className = 'text-danger fw-bold';
            questionTitle.textContent = '¡Perdiste!';
            ropePosition = 0;
            updateRopeUI();
            failGame("Tu equipo fue arrastrado en el Tira y Afloja.");
        }
    }

    startGame();
}

/**
 * Juego 4: Las Canicas
 */
function initCanicasGame(roomName, stageName) {
    let attempts = 3;
    const attemptsDisplay = document.getElementById('attempts');
    const resultText = document.getElementById('result-text');
    const parBtn = document.getElementById('par-btn');
    const imparBtn = document.getElementById('impar-btn');
    const gameArea = document.getElementById('game-area');

    function play(playerGuess) {
        if (attempts <= 0) return;
        parBtn.disabled = true;
        imparBtn.disabled = true;
        resultText.textContent = 'La máquina esconde su mano...';
        resultText.className = 'lead fw-bold text-white-50';
        gameArea.innerHTML = '<div id="machine-hand" class="display-1">✊</div>';

        setTimeout(() => {
            const machineMarbles = Math.floor(Math.random() * 10) + 1;
            const isMachineEven = machineMarbles % 2 === 0;
            const machineChoice = isMachineEven ? 'par' : 'impar';
            revealMarbles(machineMarbles);
            if (playerGuess === machineChoice) {
                resultText.textContent = `¡GANASTE! La máquina tenía ${machineMarbles} (${machineChoice}).`;
                resultText.className = 'lead fw-bold text-success';
                setTimeout(() => submitWin(roomName, stageName), 2000);
            } else {
                attempts--;
                attemptsDisplay.textContent = attempts;
                resultText.textContent = `PERDISTE. La máquina tenía ${machineMarbles} (${machineChoice}).`;
                resultText.className = 'lead fw-bold text-danger';
                if (attempts <= 0) {
                    failGame("Te has quedado sin intentos y sin canicas.");
                } else {
                    setTimeout(() => {
                        parBtn.disabled = false;
                        imparBtn.disabled = false;
                        gameArea.innerHTML = '<div id="machine-hand" class="display-1">✊</div>';
                        resultText.textContent = 'Elige de nuevo...';
                        resultText.className = 'lead fw-bold text-white';
                    }, 2500);
                }
            }
        }, 1500);
    }

    function revealMarbles(count) {
        gameArea.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const marble = document.createElement('div');
            marble.className = 'marble';
            const colors = ['#f44336', '#2196f3', '#4caf50', '#ffeb3b', '#9c27b0', '#ff9800'];
            marble.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            gameArea.appendChild(marble);
        }
    }

    parBtn.addEventListener('click', () => play('par'));
    imparBtn.addEventListener('click', () => play('impar'));
}

/**
 * Juego 5: Puente de Cristal
 */
function initPuenteGame(roomName, stageName) {
    const bridgeContainer = document.getElementById('bridge-container');
    const steps = 8;
    let currentStep = 0;
    let lives = 3;
    const safePaths = [];

    function generateSafePaths() {
        safePaths.length = 0;
        for (let i = 0; i < steps; i++) {
            safePaths.push(Math.random() < 0.5 ? 0 : 1);
        }
    }

    function buildBridge() {
        bridgeContainer.innerHTML = '';
        currentStep = 0;
        const livesDisplay = document.createElement('p');
        livesDisplay.id = 'lives-display';
        livesDisplay.className = 'text-white lead';
        livesDisplay.textContent = `Vidas restantes: ${'❤️'.repeat(lives)}`;
        bridgeContainer.appendChild(livesDisplay);
        for (let i = 0; i < steps; i++) {
            const stepRow = document.createElement('div');
            stepRow.className = 'row justify-content-center mb-2';
            const safePath = safePaths[i];
            for (let j = 0; j < 2; j++) {
                const panel = document.createElement('div');
                panel.className = 'col-4';
                const button = document.createElement('button');
                button.className = 'btn btn-outline-light w-100 p-4';
                button.dataset.step = i;
                if (j === safePath) {
                    button.dataset.safe = 'true';
                }
                button.addEventListener('click', () => {
                    if (parseInt(button.dataset.step) !== currentStep) return;
                    document.querySelectorAll(`button[data-step='${currentStep}']`).forEach(b => b.disabled = true);
                    if (button.dataset.safe) {
                        button.classList.remove('btn-outline-light');
                        button.classList.add('btn-success');
                        currentStep++;
                        if (currentStep === steps) {
                            setTimeout(() => submitWin(roomName, stageName), 500);
                        } else {
                            // No es necesario habilitar el siguiente paso aquí, el original no lo hacía y funcionaba.
                        }
                    } else {
                        button.classList.remove('btn-outline-light');
                        button.classList.add('btn-danger');
                        handleFailure();
                    }
                });
                panel.appendChild(button);
                stepRow.appendChild(panel);
            }
            bridgeContainer.appendChild(stepRow);
        }
    }

    function handleFailure() {
        lives--;
        if (lives > 0) {
            setTimeout(() => {
                alert(`¡Has caído! Te quedan ${lives} vidas.`);
                buildBridge();
            }, 1000);
        } else {
            failGame('Has caído y te has quedado sin vidas.');
        }
    }
    
    function startGame() {
        lives = 3;
        generateSafePaths();
        buildBridge();
    }

    startGame();
}