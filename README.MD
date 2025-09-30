# Escape Room Virtual en Flask

¡Bienvenido al proyecto de Escape Room Virtual! Esta es una aplicación web modular construida con Python y Flask que te permite crear y jugar a través de diferentes salas de escape temáticas, cada una con sus propios minijuegos y desafíos.

## Características

- **Arquitectura Modular**: Añade fácilmente nuevas salas de escape o nuevos juegos a las salas existentes.
- **Backend Robusto**: La lógica del juego reside en el servidor Flask para prevenir trampas y gestionar el estado de forma segura.
- **Frontend Interactivo**: Uso de JavaScript para crear experiencias de juego dinámicas.
- **Suite de Pruebas Completa**: Cobertura de pruebas con `pytest` para garantizar la fiabilidad del código.

---

## Cómo Empezar

Sigue estas instrucciones para tener una copia del proyecto funcionando en tu máquina local para desarrollo y pruebas.

### Prerrequisitos

- Python 3.9 o superior
- `pip` para la gestión de paquetes

### Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd <NOMBRE_DEL_DIRECTORIO>
    ```

2.  **Crea y activa un entorno virtual (recomendado):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # En Windows: venv\Scripts\activate
    ```

3.  **Instala las dependencias:**
    El proyecto utiliza `pyproject.toml` para definir las dependencias. Instálalas usando `pip`:
    ```bash
    pip install -e .
    ```
    El comando `-e` lo instala en modo "editable", lo que es ideal para el desarrollo.

### Ejecutar la Aplicación

Una vez instaladas las dependencias, puedes iniciar la aplicación Flask:

```bash
flask --app app run
```

O si prefieres, directamente con Python:
```bash
python app.py
```

La aplicación estará disponible en `http://127.0.0.1:5000`.

---

## Ejecutar las Pruebas

Este proyecto incluye una suite de pruebas completa para verificar la funcionalidad del núcleo y la lógica de los juegos.

Para ejecutar las pruebas, asegúrate de haber instalado las dependencias de desarrollo y luego ejecuta `pytest` desde el directorio raíz del proyecto:

```bash
pytest
```

Verás la salida de las pruebas indicando si todas han pasado correctamente.

---

## Estructura del Proyecto

```
/
├── app.py              # Aplicación principal de Flask y lógica de los juegos
├── tests/
│   └── test_app.py     # Pruebas de la aplicación
├── static/
│   ├── css/
│   ├── img/
│   └── js/
├── templates/
│   ├── layout.html
│   └── games/
├── pyproject.toml      # Definición del proyecto y dependencias
├── requirements.txt    # Lista de dependencias (generada)
└── README.MD           # Esta documentación
```

---

## Documentación de las Salas y Juegos

A continuación se detallan las salas de escape disponibles y los juegos que contienen.

### 1. El Juego del Calamar (`squid`)

Una sala de alta tensión inspirada en la popular serie.

-   **Panal de Azúcar (`panal`)**: Un juego colaborativo donde los jugadores deben resolver acertijos numéricos para trazar una forma en un panal de azúcar antes de que se acabe el tiempo o las vidas.
    -   **API:**
        -   `POST /api/squid/panal/start`: Inicia el juego, configura las vidas y el puzzle inicial.
        -   `POST /api/squid/panal/check`: Valida el segmento que el usuario ha seleccionado.

-   **Luz Roja, Luz Verde (`luzroja`)**: Un juego de movimiento y reflejos. Los jugadores deben cruzar un campo moviéndose solo durante la "luz verde". Si se mueven en "luz roja", deben responder una pregunta correctamente para no ser enviados al inicio.
    -   **API:**
        -   `POST /api/squid/luzroja/start`: Inicializa el mapa y la posición del jugador.
        -   `GET /api/squid/luzroja/gamestate`: Devuelve el estado actual del juego (posición, estado de la luz, tiempo restante).
        -   `POST /api/squid/luzroja/move`: Procesa el movimiento del jugador.
        -   `POST /api/squid/luzroja/answer`: Valida la respuesta a una pregunta.

### 2. Aventura en Minecraft (`minecraft`)

Una sala de exploración y resolución de acertijos en el universo de Minecraft.

-   **Mapa del Santuario (`mapa`)**: Los jugadores exploran un mapa, evitando trampas y encontrando notas con acertijos. Las respuestas a los acertijos son códigos que abren puertas para poder alcanzar la meta.
    -   **API:**
        -   `POST /api/minecraft/map/start`: Crea el estado del juego, incluyendo el mapa y la posición del jugador.
        -   `POST /api/minecraft/map/move`: Gestiona el movimiento del jugador y las colisiones.
        -   `POST /api/minecraft/map/solve`: Valida un código introducido por el usuario para abrir puertas.
        -   `GET /api/minecraft/map/state`: Devuelve el estado de las trampas activas.

### 3. Enigma de Inteligencia Artificial (`ai`)

Una sala donde te enfrentas a desafíos diseñados por una IA.

-   **¿Real o IA? (`real_or_ia`)**: Un juego de discernimiento visual. Se le muestran al jugador imágenes y debe adivinar si fueron generadas por una IA o si son fotografías reales.
    -   **API:**
        -   `POST /api/ai/real_or_ai/start`: Inicia el juego con un set de imágenes aleatorias.
        -   `POST /api/ai/real_or_ai/guess`: Procesa la respuesta del jugador y actualiza la puntuación y las vidas.

-   **Adivina el Número (`guess_number`)**: Un clásico juego de adivinanza. El jugador debe adivinar un número secreto entre 1 y 1000 en 10 intentos, recibiendo pistas de si su intento fue "demasiado alto" o "demasiado bajo".
    -   **API:**
        -   `POST /api/ai/guess_number/start`: Genera un número secreto y lo guarda en la sesión.
        -   `POST /api/ai/guess_number/check`: Comprueba el número del jugador contra el número secreto.

-   **Chatbot (`chatbot`)**: Un desafío conversacional donde el jugador interactúa con una IA (potenciada por Google Gemini) para convencerla de que es humano superando 3 escenarios de reflexión.
    -   **API:**
        -   `POST /api/gemini_chat`: Envía el historial de la conversación a la API de Gemini y devuelve la respuesta de la IA.

---

## Cómo Añadir un Nuevo Juego

La estructura modular facilita la adición de nuevos juegos. Sigue la guía que estaba previamente en este `README` (ahora parte de la documentación para contribuir) para añadir tu propio minijuego. Recuerda siempre:

1.  **Registrar la etapa** en el diccionario `escape_rooms` en `app.py`.
2.  **Crear los archivos HTML y JS** en `templates` y `static`.
3.  **Desarrollar la lógica de la API** en `app.py`, manteniendo el estado del juego en la `session`.
4.  **Construir el frontend** para que se comunique con tu nueva API.
5.  **¡Añadir pruebas!** Crea nuevos tests en `tests/test_app.py` para tu juego.