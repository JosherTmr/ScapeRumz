/**
 * =============================================================
 * Funciones Auxiliares Globales para los Escape Rooms
 * =============================================================
 */

/**
 * Envía una señal de victoria al backend.
 * @param {string} roomName - El nombre de la sala actual.
 * @param {string} stageName - El nombre de la etapa actual.
 * @param {string} token - El token de victoria de un solo uso.
 */
function submitWin(roomName, stageName, token) {
    console.log(`Victoria en: ${roomName}/${stageName}. Enviando al servidor...`);
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/win/${roomName}/${stageName}`;

    // --- MEJORA DE SEGURIDAD ---
    // Añade el token como un campo oculto para la verificación en el backend.
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'token';
    tokenInput.value = token;
    form.appendChild(tokenInput);
    // -------------------------

    document.body.appendChild(form);
    form.submit();
}

/**
 * Gestiona una condición de derrota, mostrando un modal para reintentar.
 * @param {string} message - El mensaje que se mostrará al jugador.
 * @param {string} roomName - El nombre de la sala actual (no se usa para redirigir).
 */
function failGame(message, roomName) {
    // Crear un overlay oscuro
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '10000';

    // Crear el contenido del modal
    const modal = document.createElement('div');
    modal.style.backgroundColor = '#15202b'; // Color oscuro del panel
    modal.style.color = 'white';
    modal.style.padding = '30px';
    modal.style.borderRadius = '10px';
    modal.style.textAlign = 'center';
    modal.style.border = '2px solid #0891b2'; // Borde cian

    // Título del modal
    const title = document.createElement('h2');
    title.innerText = 'Has Perdido';
    title.style.marginBottom = '15px';

    // Mensaje de derrota
    const text = document.createElement('p');
    text.innerText = message;
    text.style.marginBottom = '25px';
    text.style.fontSize = '1.1rem';

    // Botón para reintentar
    const retryButton = document.createElement('button');
    retryButton.innerText = 'Reintentar';
    retryButton.className = 'btn btn-lg btn-primary'; // Clases de Bootstrap
    retryButton.onclick = function() {
        window.location.reload(); // Simplemente recarga la página actual
    };

    // Ensamblar el modal
    modal.appendChild(title);
    modal.appendChild(text);
    modal.appendChild(retryButton);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}
