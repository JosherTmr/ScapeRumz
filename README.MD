# Escape Room Virtual en Flask

Este es un proyecto de una aplicación web de Escape Room modular creada con Python y el framework Flask.

## Tecnologías Utilizadas

-   **Lenguaje de Programación**: Python
-   **Framework Backend**: Flask
-   **Framework Frontend**: Bootstrap 5 para los estilos base.
-   **Interactividad**: JavaScript puro (Vanilla JS) para la lógica de los juegos.

## Instalación

1.  **Clona el repositorio o descarga los archivos.**

2.  **Crea un entorno virtual (recomendado):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # En Windows usa `venv\Scripts\activate`
    ```

3.  **Instala las dependencias:**
    ```bash
    pip install -r requirements.txt
    ```

## Cómo Ejecutar la Aplicación

1.  **Asegúrate de estar en el directorio raíz del proyecto** (donde se encuentra `app.py`).

2.  **Ejecuta el siguiente comando en tu terminal:**
    ```bash
    python app.py
    ```

3.  **Abre tu navegador web y ve a la siguiente dirección:**
    ```
    http://127.0.0.1:5000
    ```

¡Y eso es todo! Ya puedes empezar a jugar.

---

## Documentación para Desarrolladores

### Cómo añadir una nueva Sala de Escape

Para añadir una nueva sala, debes modificar el diccionario `escape_rooms` en el archivo `app.py`.

Existen dos tipos de salas:

1.  **`puzzle`**: Usan una única plantilla para todos los acertijos. Ideal para juegos basados en preguntas y respuestas.
2.  **`unique`**: Cada etapa tiene su propia plantilla HTML y lógica de frontend. Ideal para juegos más complejos e interactivos.

#### Ejemplo de una nueva sala tipo `puzzle`:

```python
'nombre_de_la_sala': {
    'title': 'Título de la Sala',
    'stages': ['etapa1', 'etapa2', 'etapa3'],
    'template_type': 'puzzle',
    'data': {
        'etapa1': {
            'title': 'Título de la Etapa 1',
            'question': 'La pregunta del acertijo.',
            'hint': 'Una pista para el jugador.',
            'answer': 'larespuesta'
        },
        'etapa2': {
            # ... datos para la etapa 2
        },
        # ... más etapas
    }
},
```

**Pasos:**

1.  **Modifica `app.py`**: Añade una nueva entrada al diccionario `escape_rooms` con la estructura anterior.
2.  **No necesitas crear nuevos archivos HTML**, ya que este tipo de sala reutiliza `templates/puzzle.html`.

#### Ejemplo de una nueva sala tipo `unique`:

```python
'nombre_de_la_sala': {
    'title': 'Título de la Sala',
    'stages': ['juego1', 'juego2'],
    'template_type': 'unique',
    'data': {} # La lógica está en el frontend
},
```

**Pasos:**

1.  **Modifica `app.py`**: Añade la nueva entrada al diccionario `escape_rooms`.
2.  **Crea una nueva carpeta para la sala**:
    *   En `templates/games/`, crea una carpeta con el `nombre_de_la_sala`. (ej: `templates/games/nombre_de_la_sala/`)
3.  **Crea las plantillas para cada etapa**:
    *   Dentro de la nueva carpeta, crea un archivo HTML para cada etapa definida en la lista `stages`. (ej: `templates/games/nombre_de_la_sala/juego1.html`, `templates/games/nombre_de_la_sala/juego2.html`)
4.  **(Opcional) Añade archivos estáticos**:
    *   Si tu juego necesita JavaScript, crea una carpeta en `static/js/games/nombre_de_la_sala/` y añade tus archivos `.js`.
    *   Si tu juego necesita imágenes, crea una carpeta en `static/img/nombre_de_la_sala/` y añade tus imágenes.

### Cómo añadir un nuevo juego a una sala existente

1.  **Abre `app.py`**.
2.  **Busca la sala** en el diccionario `escape_rooms` a la que quieres añadir el juego.
3.  **Añade el nombre de la nueva etapa** a la lista `'stages'`.
4.  **Si la sala es de tipo `puzzle`**:
    *   Añade una nueva entrada al diccionario `'data'` con la pregunta, pista y respuesta para la nueva etapa.
5.  **Si la sala es de tipo `unique`**:
    *   Crea el archivo HTML correspondiente en `templates/games/nombre_de_la_sala/nombre_de_la_etapa.html`.
    *   Añade los archivos JS o de imagen necesarios en las carpetas `static` correspondientes.

### Integración de las plantillas

El sistema de rutas de Flask se encarga de renderizar las plantillas automáticamente.

*   Para las salas `puzzle`, la ruta `play_stage` renderiza `puzzle.html`, pasándole los datos del acertijo correspondiente.
*   Para las salas `unique`, la misma ruta `play_stage` construye la ruta a la plantilla dinámicamente: `games/{room_name}/{stage_name}.html`. Por eso es crucial que los nombres de las carpetas y archivos coincidan con los definidos en el diccionario `escape_rooms`.

### Estructura de un Juego (Tipo `unique`)

Cuando creas un juego con `template_type: 'unique'`, tienes control total sobre la experiencia. A continuación se muestra una estructura base y plantillas para que la integración sea perfecta.

#### 1. Archivo HTML (`templates/games/nombre_de_la_sala/juego.html`)

El HTML es el corazón de tu juego. La plantilla recibe variables de Flask que son cruciales para la comunicación con el backend.

```html
{% extends "layout.html" %}

{% block content %}
<div class="container text-center">
    <h1>Nombre del Juego</h1>
    <p>Aquí va la descripción y los elementos de tu juego.</p>

    <!-- Elementos del juego (botones, lienzos, etc.) -->
    <button id="win-button">He ganado</button>
</div>

<!-- Scripts específicos para este juego -->
<script>
    // Variables pasadas desde Flask
    const roomName = "{{ room_name }}";
    const stageName = "{{ stage_name }}";
    const winToken = "{{ win_token }}"; // ¡Token de seguridad MUY importante!
</script>
<script src="{{ url_for('static', filename='js/games/nombre_de_la_sala/juego.js') }}"></script>
{% endblock %}
```

-   **`room_name`** y **`stage_name`**: Identifican la sala y etapa actual.
-   **`win_token`**: Es un token de seguridad de un solo uso. **Debes enviarlo al backend para verificar la victoria** y evitar que los jugadores se salten etapas.

#### 2. Archivo JavaScript (`static/js/games/nombre_de_la_sala/juego.js`)

Aquí reside la lógica de tu juego. El objetivo final de este script es determinar si el jugador ha ganado. Cuando eso ocurra, debes llamar a la función `completeStage`.

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // Lógica principal de tu juego
    console.log(`Iniciando juego: ${roomName} - ${stageName}`);

    const winButton = document.getElementById('win-button');
    winButton.addEventListener('click', () => {
        // Aquí iría tu condición de victoria.
        // Por ejemplo: if (score > 100) { ... }
        console.log("El jugador ha ganado la etapa.");
        completeStage();
    });
});

/**
 * Función para notificar al backend que la etapa ha sido completada.
 * Crea un formulario dinámico y lo envía.
 */
function completeStage() {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/win/${roomName}/${stageName}`;

    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'token';
    tokenInput.value = winToken; // Usa el token de seguridad proporcionado por Flask

    form.appendChild(tokenInput);
    document.body.appendChild(form);
    form.submit();
}
```

#### 3. Archivo CSS (Opcional) (`static/css/games/nombre_de_la_sala/juego.css`)

Si tu juego requiere estilos personalizados, puedes crear un archivo CSS y enlazarlo en tu plantilla HTML.

```css
/* Estilos para tu juego */
.container {
    background-color: #f0f0f0;
}
```

Y en el HTML, lo enlazarías así dentro del `{% block content %}`:

```html
<link rel="stylesheet" href="{{ url_for('static', filename='css/games/nombre_de_la_sala/juego.css') }}">
```

#### 4. Lógica de Backend en `app.py` (Opcional)

Si tu juego necesita una lógica más compleja que no puede vivir solo en el frontend (ej. guardar puntuaciones, verificar respuestas complejas, etc.), puedes crear tus propias rutas de API en `app.py`.

```python
@app.route('/api/mi_juego/verificar', methods=['POST'])
def verificar_mi_juego():
    data = request.json
    # ... procesar la lógica del juego ...
    respuesta_correcta = True # o False
    return jsonify({'success': respuesta_correcta})
```

Luego, desde tu archivo JavaScript, puedes usar `fetch` para comunicarte con esta API:

```javascript
fetch('/api/mi_juego/verificar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jugada: 'valor' })
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        completeStage();
    }
});
```