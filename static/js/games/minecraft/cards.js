/**
 * =============================================================
 * Juego 4: Memoria de Mobs (v1.1 - Con vista previa inicial)
 * =============================================================
 */
function initMemoryGame(roomName, stageName, winToken) {
    // --- Referencias al DOM ---
    const gameBoard = document.getElementById('memory-game-board');
    const livesDisplay = document.getElementById('lives-display');
    const resetButton = document.getElementById('reset-button');
    const gameStatus = document.getElementById('game-status'); // <-- NUEVA REFERENCIA

    // --- Configuración del Juego ---
    const MAX_LIVES = 3;
    const TOTAL_PAIRS = 12;
    const PREVIEW_TIME = 3000; // 3 segundos de vista previa

    // --- Texturas de Mobs (sin cambios) ---
    const mobTextures = [
        { name: 'steve',    img: '/static/img/steve.png' },
        { name: 'zombie',   img: '/static/img/zombie.jpg' },
        { name: 'skeleton', img: '/static/img/esqueleto.png' },
        { name: 'spider',   img: '/static/img/arana.jpg' },
        { name: 'enderman', img: '/static/img/enderman.jpg' },
        { name: 'pig',      img: '/static/img/cerdo.jpg' },
        { name: 'cow',      img: '/static/img/vaca.jpg' },
        { name: 'sheep',    img: '/static/img/oveja.jpg' },
        { name: 'ghast',    img: '/static/img/ghast.jpg' },
        { name: 'blaze',    img: '/static/img/blaze.jpg' },
        { name: 'villager', img: '/static/img/aldeano.jpg' },
        { name: 'axolotl',  img: '/static/img/ajolote.png' }
      ];

      const creeperCard = {
        name: 'creeper',
        img: '/static/img/player.jpg' // asegúrate de guardarlo en la carpeta
      };



    // --- Estado del Juego ---
    let lives;
    let cards = [];
    let firstCard, secondCard;
    let lockBoard;
    let matchedPairs;

    /** Baraja un array usando el algoritmo Fisher-Yates */
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /** Prepara y renderiza el tablero de juego */
    function setupGame() {
        // Reiniciar estado
        lives = MAX_LIVES;
        matchedPairs = 0;
        firstCard = null;
        secondCard = null;
        gameStatus.textContent = ''; // Limpia el estado

        let cardPool = [...mobTextures, ...mobTextures];
        cardPool.push(creeperCard);
        cards = shuffle(cardPool);

        gameBoard.innerHTML = '';
        updateLivesUI();

        cards.forEach(cardData => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card');
            cardElement.dataset.mob = cardData.name;
            cardElement.innerHTML = `
                <div class="card-face card-front"><img src="${cardData.img}" alt="${cardData.name}"></div>
                <div class="card-face card-back"></div>`;
            cardElement.addEventListener('click', flipCard);
            gameBoard.appendChild(cardElement);
        });

        // --- INICIO DE LA LÓGICA DE VISTA PREVIA ---
        lockBoard = true; // Bloquea el tablero durante la vista previa
        gameStatus.textContent = 'Memoriza la posición...';
        const allCards = document.querySelectorAll('.card');

        // 1. Muestra todas las cartas
        allCards.forEach(card => card.classList.add('flip'));

        // 2. Después de PREVIEW_TIME, las oculta y permite jugar
        setTimeout(() => {
            allCards.forEach(card => card.classList.remove('flip'));
            lockBoard = false; // Desbloquea el tablero
            gameStatus.textContent = '¡A jugar!';
            // Opcional: limpiar el mensaje después de un rato
            setTimeout(() => gameStatus.textContent = '', 1500);
        }, PREVIEW_TIME);
        // --- FIN DE LA LÓGICA DE VISTA PREVIA ---
    }

    /** Maneja el evento de hacer clic en una carta */
    function flipCard() {
        if (lockBoard || this === firstCard || this.classList.contains('matched')) return;
        this.classList.add('flip');
        if (!firstCard) {
            firstCard = this;
            return;
        }
        secondCard = this;
        lockBoard = true;
        checkForMatch();
    }

    /** Comprueba si las dos cartas volteadas son un par */
    function checkForMatch() {
        const isMatch = firstCard.dataset.mob === secondCard.dataset.mob;
        const isCreeper = firstCard.dataset.mob === 'creeper' || secondCard.dataset.mob === 'creeper';

        if (isMatch && !isCreeper) {
            matchedPairs++;
            disableCards();
            if (matchedPairs === TOTAL_PAIRS) {
                gameStatus.textContent = '¡Has ganado!';
                setTimeout(() => submitWin(roomName, stageName, winToken), 1000);
            }
        } else {
            loseLife();
            unflipCards();
        }
    }

    /** Mantiene las cartas volteadas y las deshabilita */
    function disableCards() {
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');
        firstCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('click', flipCard);
        resetBoard();
    }

    /** Voltea las cartas si no son un par */
    function unflipCards() {
        setTimeout(() => {
            firstCard.classList.remove('flip');
            secondCard.classList.remove('flip');
            resetBoard();
        }, 1200);
    }

    /** Resetea las variables para el siguiente turno */
    function resetBoard() {
        [firstCard, secondCard, lockBoard] = [null, null, false];
    }

    /** Reduce una vida y gestiona la derrota */
    function loseLife() {
        lives--;
        updateLivesUI();
        gameBoard.classList.add('shake-animation');
        setTimeout(() => gameBoard.classList.remove('shake-animation'), 400);

        if (lives <= 0) {
            gameStatus.textContent = '¡Has perdido!';
            lockBoard = true;
            setTimeout(() => {
                failGame("El Creeper ha saboteado tu memoria. ¡Inténtalo de nuevo!", roomName);
            }, 1500);
        }
    }

    /** Actualiza la UI de las vidas */
    function updateLivesUI() {
        livesDisplay.textContent = '❤️'.repeat(lives) + '🖤'.repeat(MAX_LIVES - lives);
    }

    // --- Inicialización ---
    resetButton.addEventListener('click', setupGame);
    setupGame();
}
