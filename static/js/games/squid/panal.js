/**
 * Juego 2: Panal de Azúcar (Versión Colaborativa)
 * El equipo resuelve pistas para decirle al "conductor" qué segmento trazar.
 */
function initPanalGame(roomName, stageName, winToken) {
    // Referencias al DOM
    const canvas = document.getElementById('panal-canvas');
    const ctx = canvas.getContext('2d');
    const timerEl = document.getElementById('timer');
    const livesContainer = document.getElementById('lives-container');
    const puzzleCounterEl = document.getElementById('puzzle-counter');
    const puzzleTextEl = document.getElementById('puzzle-text');
    const feedbackEl = document.getElementById('feedback');

    // Estado del juego
    let gameState = {
        config: null,
        lives: 0,
        tracedSegments: [],
        gameOver: false,
    };
    let timerInterval;

    // --- LÓGICA DE DIBUJO ---

    function draw() {
        if (!gameState.config) return;

        const { vertices, segments } = gameState.config;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dibuja los segmentos
        segments.forEach(seg => {
            const start = vertices[seg.start].pos;
            const end = vertices[seg.end].pos;
            const isTraced = gameState.tracedSegments.includes(seg.id);

            ctx.beginPath();
            ctx.moveTo(start[0], start[1]);
            ctx.lineTo(end[0], end[1]);
            ctx.strokeStyle = isTraced ? '#6f1d1b' : '#d4a373';
            ctx.lineWidth = isTraced ? 6 : 4;
            ctx.stroke();
        });

        // Dibuja los vértices y números
        Object.values(vertices).forEach(vertex => {
            ctx.beginPath();
            ctx.arc(vertex.pos[0], vertex.pos[1], 15, 0, 2 * Math.PI);
            ctx.fillStyle = '#e6b8a2';
            ctx.fill();

            ctx.fillStyle = '#6f1d1b';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(vertex.num, vertex.pos[0], vertex.pos[1]);
        });

        // Dibuja las grietas
        drawCracks();
    }

    function drawCracks() {
        const cracksToDraw = gameState.config.lives - gameState.lives;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;

        const crackPatterns = [
            () => { ctx.moveTo(50, 50); ctx.lineTo(150, 150); ctx.lineTo(120, 180); },
            () => { ctx.moveTo(450, 80); ctx.lineTo(350, 180); ctx.lineTo(380, 200); },
            () => { ctx.moveTo(100, 400); ctx.lineTo(200, 300); ctx.lineTo(180, 280); }
        ];

        for (let i = 0; i < cracksToDraw; i++) {
            ctx.beginPath();
            if(crackPatterns[i]) crackPatterns[i]();
            ctx.stroke();
        }
    }

    // --- LÓGICA DEL JUEGO ---

    async function startGame() {
        try {
            const response = await fetch(`/api/squid/panal/start`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to start game');

            const data = await response.json();
            gameState.config = data.config;
            gameState.lives = data.config.lives;
            gameState.tracedSegments = [];

            updateUI(data.puzzle, gameState.lives);
            startTimer(data.config.time_limit);
            draw();

        } catch (error) {
            console.error("Error starting game:", error);
            feedbackEl.textContent = "Error al cargar. Intenta recargar la página.";
        }
    }

    function startTimer(duration) {
        let timeLeft = duration;
        timerEl.textContent = timeLeft;

        timerInterval = setInterval(() => {
            timeLeft--;
            timerEl.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                if (!gameState.gameOver) {
                    gameState.gameOver = true;
                    failGame("¡Se acabó el tiempo! El panal se ha roto.", roomName);
                }
            }
        }, 1000);
    }

    function updateUI(puzzleData, lives) {
        // Actualizar contador de pistas
        const puzzleNumber = gameState.tracedSegments.length + 1;
        puzzleCounterEl.textContent = `Pista ${puzzleNumber} de ${gameState.config.segments.length}`;
        puzzleTextEl.textContent = puzzleData.clue;

        // Actualizar vidas
        livesContainer.innerHTML = '';
        for (let i = 0; i < gameState.config.lives; i++) {
            const img = document.createElement('img');
            img.src = "https://placehold.co/100x100/fca311/6f1d1b?text=OK"; // Placeholder icon
            img.alt = "Vida";
            img.className = 'crack-icon ' + (i < lives ? 'active' : '');
            livesContainer.appendChild(img);
        }

        draw();
    }

    // --- MANEJO DE INTERACCIÓN ---

    function getClickedSegment(clickX, clickY) {
        const { segments, vertices } = gameState.config;
        let clickedSegment = null;
        let minDistance = 20; // Margen de click en píxeles

        segments.forEach(seg => {
            // No se puede clickear un segmento ya trazado
            if (gameState.tracedSegments.includes(seg.id)) return;

            const p1 = vertices[seg.start].pos;
            const p2 = vertices[seg.end].pos;

            const dist = distToSegment({ x: clickX, y: clickY }, { x: p1[0], y: p1[1] }, { x: p2[0], y: p2[1] });

            if (dist < minDistance) {
                minDistance = dist;
                clickedSegment = seg;
            }
        });
        return clickedSegment;
    }

    canvas.addEventListener('click', async (event) => {
        if (gameState.gameOver || !gameState.config) return;

        const rect = canvas.getBoundingClientRect();
        // Ajustar coordenadas al tamaño real del canvas
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        const segment = getClickedSegment(x, y);

        if (segment) {
            feedbackEl.textContent = 'Verificando...';
            try {
                const response = await fetch(`/api/squid/panal/check`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ segment_id: segment.id })
                });
                const result = await response.json();

                gameState.lives = result.new_lives;

                if (result.correct) {
                    feedbackEl.textContent = '¡Correcto! Siguiente pista...';
                    feedbackEl.className = 'text-success';
                    gameState.tracedSegments.push(segment.id);
                } else {
                    feedbackEl.textContent = '¡Incorrecto! El panal se agrieta...';
                    feedbackEl.className = 'text-danger';
                }

                if (result.game_over) {
                    gameState.gameOver = true;
                    clearInterval(timerInterval);
                    setTimeout(() => {
                        if (result.win) {
                            submitWin(roomName, stageName, winToken);
                        } else {
                            failGame("El panal se ha roto por completo.", roomName);
                        }
                    }, 1500);
                } else {
                    updateUI(result.next_puzzle, result.new_lives);
                }

            } catch (error) {
                console.error("Error checking segment:", error);
                feedbackEl.textContent = 'Error de conexión.';
            }
        }
    });

    // --- FUNCIÓN AUXILIAR DE GEOMETRÍA ---
    // Calcula la distancia mínima desde un punto a un segmento de línea.
    function distToSegment(p, v, w) {
        const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
        if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const projection = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
        return Math.hypot(p.x - projection.x, p.y - projection.y);
    }

    // Iniciar el juego
    startGame();
}