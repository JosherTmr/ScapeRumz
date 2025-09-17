/**
 * =============================================================
 * Juego del Ahorcado (Versión Difícil - 3 Rondas)
 * =============================================================
 */
function initHangmanGame(roomName, stageName, winToken) {
    // --- Selección de Elementos del DOM ---
    const stageText = document.querySelector(".stage-text");
    const wordDisplay = document.querySelector(".word-display");
    const guessesText = document.querySelector(".guesses-text b");
    const keyboardDiv = document.querySelector(".keyboard");
    const hangmanImage = document.querySelector(".hangman-box img");
    const gameModal = document.querySelector(".game-modal");
    const modalContent = gameModal.querySelector(".content");

    // --- NUEVO: Estado del Juego de Múltiples Rondas ---
    let currentWord, correctLetters, wrongGuessCount;
    let wordIndex = 0; // Para rastrear en qué palabra estamos (0, 1, 2)
    let sessionWords = []; // Almacenará las 3 palabras de esta partida
    const maxGuesses = 6;

    const setupNextWord = () => {
        // Selecciona la palabra actual de la lista de la sesión
        const { word, hint } = sessionWords[wordIndex];
        currentWord = word;

        // Actualiza la UI
        stageText.innerText = `Palabra ${wordIndex + 1} de 3`;
        document.querySelector(".hint-text b").innerText = hint;

        // Reinicia el tablero
        correctLetters = [];
        wrongGuessCount = 0;
        hangmanImage.src = `https://www-codingnepalweb-com.translate.goog/demos/build-hangman-game-html-javascript/images/hangman-0.svg`;
        guessesText.innerText = `${wrongGuessCount} / ${maxGuesses}`;
        wordDisplay.innerHTML = currentWord.split("").map(() => `<li class="letter"></li>`).join("");
        keyboardDiv.querySelectorAll("button").forEach(btn => btn.disabled = false);
        gameModal.classList.remove("show");
    }

    const selectSessionWords = () => {
        // --- NUEVO: Banco de Palabras con Pistas Ambiguas ---
        const wordList = [
            { word: "CREEPER", hint: "Me acerco en silencio, exploto sin avisar y todos me temen." },
            { word: "PIEDRA", hint: "Soy abundante bajo tus pies, duro como roca, pero fácil de romper con un pico." },
            { word: "REDSTONE", hint: "No soy sangre, pero puedo dar energía y hacer máquinas." },
            { word: "ENDERMAN", hint: "Si me miras a los ojos me enojo, pero me gusta mover bloques." },
            { word: "PORTAL", hint: "Sin mí no puedes viajar al Nether ni al End." },
            { word: "LAVA", hint: "Brillo como el sol, quemo como el fuego, y en mí no debes caer." },
            { word: "YUNQUE", hint: "Soy pesado, sirvo para reparar, y si caigo desde lo alto puedo aplastarte." },
            { word: "LANA", hint: "Lo obtienes de una oveja, con él fabricas tu primera cama." }, // lana
            { word: "ESPADA", hint: "No soy pico ni hacha, pero me usas para defenderte." },
            { word: "ALDEA", hint: "Lugar donde encuentras casas, cultivos y seres que hacen trueques." },
        ];


        // Baraja la lista y selecciona las primeras 3 palabras
        sessionWords = wordList.sort(() => 0.5 - Math.random()).slice(0, 3);
        setupNextWord();
    }

    const gameOver = (isVictory) => {
        if (!isVictory) {
            // Si pierdes en cualquier ronda, el juego termina
            setTimeout(() => {
                modalContent.querySelector("img").src = `https://www-codingnepalweb-com.translate.goog/demos/build-hangman-game-html-javascript/images/lost.gif`;
                modalContent.querySelector("h4").innerText = '¡Ahorcado!';
                modalContent.querySelector("p").innerHTML = `La palabra correcta era: <b>${currentWord}</b>`;
                gameModal.classList.add("show");
                setTimeout(() => failGame("Te has quedado sin intentos.", roomName), 2500);
            }, 300);
            return;
        }

        // Si ganas una ronda...
        if (wordIndex < 2) {
            // ...y no es la última, pasa a la siguiente palabra.
            wordIndex++;
            setTimeout(() => {
                modalContent.querySelector("img").src = `https://www-codingnepalweb-com.translate.goog/demos/build-hangman-game-html-javascript/images/victory.gif`;
                modalContent.querySelector("h4").innerText = '¡Correcto!';
                modalContent.querySelector("p").innerHTML = `Prepárate para la siguiente palabra...`;
                gameModal.classList.add("show");
                // Carga la siguiente palabra después de una pausa
                setTimeout(setupNextWord, 2000);
            }, 300);
        } else {
            // ...y es la última, ¡ganaste el minijuego!
            setTimeout(() => {
                modalContent.querySelector("img").src = `https://www-codingnepalweb-com.translate.goog/demos/build-hangman-game-html-javascript/images/victory.gif`;
                modalContent.querySelector("h4").innerText = '¡Desafío Superado!';
                modalContent.querySelector("p").innerHTML = `Has adivinado todas las palabras.`;
                gameModal.classList.add("show");
                setTimeout(() => submitWin(roomName, stageName, winToken), 2000);
            }, 300);
        }
    }

    const initGame = (e) => {
        const clickedLetter = e.target.value;
        if (clickedLetter.match(/^[A-Z]$/) && !e.target.disabled) {
            e.target.disabled = true;
            if (currentWord.includes(clickedLetter)) {
                [...currentWord].forEach((letter, index) => {
                    if (letter === clickedLetter) {
                        correctLetters.push(letter);
                        wordDisplay.querySelectorAll("li")[index].innerText = letter;
                        wordDisplay.querySelectorAll("li")[index].classList.add("guessed");
                    }
                });
            } else {
                wrongGuessCount++;
                hangmanImage.src = `https://www-codingnepalweb-com.translate.goog/demos/build-hangman-game-html-javascript/images/hangman-${wrongGuessCount}.svg`;
            }
            guessesText.innerText = `${wrongGuessCount} / ${maxGuesses}`;

            if (wrongGuessCount === maxGuesses) return gameOver(false);
            if (correctLetters.length === currentWord.length) return gameOver(true);
        }
    }

    // --- Creación del Teclado (sin cambios) ---
    for (let i = 65; i <= 90; i++) {
        const button = document.createElement("button");
        button.value = String.fromCharCode(i);
        button.innerText = String.fromCharCode(i);
        keyboardDiv.appendChild(button);
        button.addEventListener("click", initGame);
    }

    // Iniciar el juego por primera vez
    selectSessionWords();
}
