# Escape Room Virtual en Flask

Este es un proyecto de una aplicación web de Escape Room modular creada con Python y el framework Flask.

## Tecnologías Utilizadas

- **Backend**: Python con Flask (maneja el estado del juego y la lógica principal).
- **Frontend**: Plantillas de Jinja2, HTML5, CSS3.
- **Interactividad**: JavaScript puro (Vanilla JS), dividido en una librería de utilidades y scripts específicos por juego.
- **Estilos**: Bootstrap 5 como base, con estilos personalizados por juego.

---

## Estructura del Proyecto

```
/
├── app.py              # Aplicación principal de Flask y lógica de los juegos
├── static/
│   ├── css/            # Estilos CSS
│   ├── img/
│   │   └── games/      # Imágenes específicas de cada juego
│   └── js/
│       ├── game_utils.js # Funciones globales (submitWin, failGame)
│       └── games/
│           └── [room_name]/
│               └── [game_name].js   # Lógica JS del juego
├── templates/
│   ├── layout.html     # Plantilla base
│   └── games/
│       └── [room_name]/
│           └── [game_name].html # Plantilla HTML/Jinja2 del juego
└── requirements.txt
```

---

## Documentación para Desarrolladores

### Cómo añadir un nuevo juego (tipo `unique`)

Los juegos de tipo `unique` ofrecen la máxima flexibilidad y son ideales para minijuegos interactivos. Sigue estos pasos para integrar uno nuevo.

---

### Paso 1: Registrar el juego en `app.py`

1. Abre `app.py` y localiza el diccionario `escape_rooms`.
2. Busca la sala (`room`) a la que quieres añadir el juego.
3. Añade el nombre de tu nuevo juego (ej: `"nuevo_juego"`) a la lista `stages`.

**Ejemplo:** Añadiendo `"adivina_la_imagen"` a la sala `"ia"`:

```python
'ia': {
    'title': 'Sala de Inteligencia Artificial',
    'stages': ['real_or_ia', 'adivina_la_imagen'],  # <-- Añadir aquí
    'template_type': 'unique',
    'data': {}
},
```

---

### Paso 2: Crear los archivos del Frontend

Crea los siguientes archivos, reemplazando `[room_name]` y `[game_name]` con los nombres correctos.

- Archivo HTML: `templates/games/[room_name]/[game_name].html`
- Archivo JavaScript: `static/js/games/[room_name]/[game_name].js`

---

### Paso 3: Desarrollar la Lógica del Backend (API en `app.py`)

Para evitar trampas, la lógica principal del juego debe residir en el backend.  
El frontend solo se comunica a través de una API.

- **Ruta de inicio (`/start`)**: inicializa el estado del juego en la `session` de Flask.  
- **Ruta de acción (`/check`, `/guess`, etc.)**: recibe la acción del jugador, la valida contra la `session` y devuelve un JSON.

**Ejemplo de API para un juego:**

```python
from flask import session, jsonify, request

@app.route('/api/[room_name]/[game_name]/start', methods=['POST'])
def start_new_game():
    # Lógica para iniciar el juego
    session['game_secret'] = "valor_secreto"
    session['game_attempts'] = 3
    return jsonify({'success': True, 'first_question': 'Pregunta inicial'})

@app.route('/api/[room_name]/[game_name]/check', methods=['POST'])
def check_new_game_answer():
    data = request.json
    user_answer = data.get('answer')

    # Validar la respuesta
    is_correct = (user_answer == session['game_secret'])
    session['game_attempts'] -= 1

    # Condiciones de victoria o derrota
    if is_correct:
        return jsonify({'status': 'win', 'message': '¡Correcto!'})
    elif session['game_attempts'] <= 0:
        return jsonify({'status': 'lose', 'message': 'Sin intentos.'})
    else:
        return jsonify({'status': 'continue', 'message': 'Incorrecto, sigue.'})
```

---

### Paso 4: Construir el Frontend

#### Archivo HTML `[game_name].html`

Debe heredar de `layout.html` y estructurar los scripts en el bloque `scripts`.

```html
{% extends "layout.html" %}

{% block content %}
<style>
    /* ... tus estilos ... */
</style>

<div id="game-container"></div>
{% endblock %}

{% block scripts %}
<script src="{{ url_for('static', filename='js/game_utils.js') }}"></script>
<script src="{{ url_for('static', filename='js/games/[room_name]/[game_name].js') }}"></script>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        initNewGame('{{ room_name }}', '{{ stage_name }}', '{{ win_token }}');
    });
</script>
{% endblock %}
```

---

#### Archivo JavaScript `[game_name].js`

La lógica del frontend debe estar encapsulada en una función `init...` y usar las funciones de `game_utils.js`.

```javascript
/**
 * Inicializa el [Nombre del Juego].
 * @param {string} roomName - Nombre de la sala (inyectado por Flask).
 * @param {string} stageName - Nombre de la etapa (inyectado por Flask).
 * @param {string} winToken - Token de seguridad para la victoria.
 */
function initNewGame(roomName, stageName, winToken) {
    // 1. Obtener referencias a los elementos del DOM
    const button = document.getElementById('my-button');

    // 2. Lógica para comunicarse con la API del backend
    async function checkAnswer() {
        const response = await fetch('/api/[room_name]/[game_name]/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer: 'valor' })
        });
        const result = await response.json();

        // 3. Reaccionar a la respuesta del backend
        if (result.status === 'win') {
            submitWin(roomName, stageName, winToken);
        } else if (result.status === 'lose') {
            failGame("Mensaje de derrota.", roomName);
        } else {
            // El juego continúa... actualizar la UI.
        }
    }

    // 4. Añadir event listeners
    button.addEventListener('click', checkAnswer);

    // 5. Iniciar el juego (opcional)
    // fetch('/api/[room_name]/[game_name]/start', { method: 'POST' });
}
```
