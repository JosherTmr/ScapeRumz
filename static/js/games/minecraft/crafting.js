// Esta función será llamada desde la plantilla HTML con las variables del servidor.
function initCraftingEnigmaGame(roomName, stageName, winToken) {
    const riddleText = document.getElementById('riddle-text');
    const diagramImage = document.getElementById('diagram-image');
    const craftingGrid = document.getElementById('crafting-grid');
    const inventory = document.getElementById('inventory');
    const craftButton = document.getElementById('craft-button');
    const feedback = document.getElementById('feedback');

    // Texturas de los ítems para la visualización en el frontend.
    const itemTextures = {
        stick: 'https://p.novaskin.me/4905183964.png',
        diamond: 'https://p.novaskin.me/4889073312.png',
        iron_ingot: 'https://p.novaskin.me/4343813293.png',
        gold_ingot: 'https://p.novaskin.me/1811033392.png',
        redstone_dust: 'https://p.novaskin.me/4890333140.png',
        gunpowder: 'https://p.novaskin.me/4333913166.png',
        sand: 'https://p.novaskin.me/4323233157.png',
        gravel: 'https://p.novaskin.me/4313173155.png',
        flint: 'https://p.novaskin.me/4363233301.png'
    };

    let gridState = {}; // Objeto para el estado: {'x,y': 'itemName'}
    let draggedElement = null;

    // Función asíncrona para configurar el juego llamando al backend.
    async function setupGame() {
        feedback.textContent = 'Cargando nuevo puzzle...';
        feedback.className = 'text-info';
        craftButton.disabled = true;

        try {
            const response = await fetch('/api/minecraft/crafting/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error('No se pudo iniciar el juego desde el servidor.');

            const data = await response.json();

            // Actualizar la UI con los datos recibidos.
            riddleText.textContent = data.riddle;
            diagramImage.src = data.diagram_image;
            diagramImage.style.display = 'block'; // Asegurarse de que la imagen sea visible

            // Poblar el inventario.
            inventory.innerHTML = '';
            data.inventory.forEach(itemName => {
                if (itemTextures[itemName]) {
                    const item = document.createElement('div');
                    item.classList.add('item');
                    item.style.backgroundImage = `url(${itemTextures[itemName]})`;
                    item.dataset.item = itemName;
                    item.draggable = true;
                    item.addEventListener('dragstart', onDragStart);
                    inventory.appendChild(item);
                }
            });

            // Reiniciar la grid de crafteo y el estado.
            craftingGrid.innerHTML = '';
            gridState = {};
            for (let y = 0; y < 3; y++) {
                for (let x = 0; x < 3; x++) {
                    const slot = document.createElement('div');
                    slot.classList.add('grid-slot');
                    slot.dataset.coord = `${x},${y}`;
                    slot.addEventListener('dragover', (e) => e.preventDefault());
                    slot.addEventListener('drop', onDropToGrid);
                    craftingGrid.appendChild(slot);
                }
            }

            feedback.textContent = '';
            craftButton.disabled = false;

        } catch (error) {
            console.error('Error al configurar el juego:', error);
            feedback.textContent = 'Error al cargar el juego. Por favor, recarga la página.';
            feedback.className = 'text-danger';
        }
    }

    function onDragStart(e) {
        draggedElement = e.target;
        setTimeout(() => e.target.classList.add('dragging'), 0);
    }

    function onDropToGrid(e) {
        e.preventDefault();
        const slot = e.target.closest('.grid-slot');
        if (!slot || slot.firstChild || !draggedElement) return;

        const coord = slot.dataset.coord;
        gridState[coord] = draggedElement.dataset.item;

        slot.appendChild(draggedElement);
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }

    function onDropToInventory(e) {
        e.preventDefault();
        if (!draggedElement || e.target.closest('.item')) return;

        const parentSlot = draggedElement.parentElement;
        if (parentSlot && parentSlot.classList.contains('grid-slot')) {
            const coord = parentSlot.dataset.coord;
            delete gridState[coord];
        }

        inventory.appendChild(draggedElement);
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }

    async function checkCrafting() {
        craftButton.disabled = true;
        feedback.textContent = 'Verificando...';
        feedback.className = 'text-info';

        try {
            const response = await fetch('/api/minecraft/crafting/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grid_state: gridState })
            });

            if (!response.ok) throw new Error('Error del servidor durante la verificación.');

            const result = await response.json();

            if (result.correct) {
                feedback.textContent = '¡Crafteo exitoso!';
                feedback.className = 'text-success';
                // La función submitWin está en game_utils.js y se encarga de enviar el token.
                setTimeout(() => submitWin(roomName, stageName, winToken), 1500);
            } else {
                feedback.textContent = 'La combinación es incorrecta. Reiniciando...';
                feedback.className = 'text-danger';
                setTimeout(setupGame, 2000);
            }
        } catch (error) {
            console.error('Error al verificar el crafteo:', error);
            feedback.textContent = 'Error de comunicación. Intenta de nuevo.';
            feedback.className = 'text-danger';
            craftButton.disabled = false;
        }
    }

    // --- Inicialización del Juego ---
    // Añadir listeners a los elementos que no se regeneran.
    craftButton.addEventListener('click', checkCrafting);
    inventory.addEventListener('dragover', (e) => e.preventDefault());
    inventory.addEventListener('drop', onDropToInventory);

    // Iniciar el juego por primera vez.
    setupGame();
}