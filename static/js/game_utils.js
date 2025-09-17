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
 * Gestiona una derrota y redirige al INICIO de la sala correcta.
 * @param {string} message - El mensaje que se mostrará al jugador.
 * @param {string} roomName - El nombre de la sala que se debe reiniciar.
 */
function failGame(message, roomName) {
    alert(message + "\n\nSerás redirigido para que puedas intentarlo de nuevo.");
    window.location.href = `/start/${roomName}`;
}
