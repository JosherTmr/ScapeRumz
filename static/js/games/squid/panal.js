/**
 * Juego 2: Panal de Azúcar
 */
function initPanalGame(roomName, stageName, winToken) {
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
            failGame('Respuesta incorrecta en el quiz del panal.', roomName);
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
                    setTimeout(() => submitWin(roomName, stageName, winToken), 1000);
                    }
                } else {
                    feedback.textContent = '¡Secuencia incorrecta! El panal se rompió.';
                    feedback.className = 'text-danger';
                failGame('Secuencia incorrecta en el panal.', roomName);
                }
            }
        });
    });

    loadQuestion();
}
