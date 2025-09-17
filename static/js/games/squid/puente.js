/**
 * Juego 5: Puente de Cristal
 */
function initPuenteGame(roomName, stageName, winToken) {
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
                            setTimeout(() => submitWin(roomName, stageName, winToken), 500);
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
            failGame('Has caído y te has quedado sin vidas.', roomName);
        }
    }

    function startGame() {
        lives = 3;
        generateSafePaths();
        buildBridge();
    }

    startGame();
}
