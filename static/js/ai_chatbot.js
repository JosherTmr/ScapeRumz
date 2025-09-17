/**
 * =============================================================
 * Juego 3 (Sala AI): Test de Empatía Inversa (Chatbot)
 * =============================================================
 */
function initChatbotGame(roomName, stageName, winToken) {
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
                submitWin(roomName, stageName, winToken);
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
