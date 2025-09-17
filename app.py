import time
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session, flash
import os
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)
# ¡IMPORTANTE! Cambia esto en un entorno de producción por un valor seguro y aleatorio.
app.secret_key = 'dev_secret_key_12345'

# --- Base de Datos en Memoria ---
# Define la estructura y el orden de las salas y sus etapas.
escape_rooms = {
    'laboratorio': {
        'title': 'El Laboratorio Secreto del Dr. Albus',
        'stages': ['intro', 'acertijo1', 'acertijo2', 'acertijo3'],
        'template_type': 'puzzle', # Usa la misma plantilla para todas las etapas
        'data': {
            'intro': {
                'title': 'El Comienzo',
                'question': 'Has despertado en un laboratorio abandonado. La puerta principal está cerrada. En una nota, lees: "Para escapar, debes probar tu intelecto. Di la palabra mágica para comenzar". La palabra es la clave para desbloquear el primer terminal.',
                'hint': 'La palabra mágica suele ser la que se usa para empezar cualquier aventura en un terminal.',
                'answer': 'start'
            },
            'acertijo1': {
                'title': 'Acertijo Químico',
                'question': 'En la pared, ves la fórmula H2O. Un dispositivo te pide que introduzcas el nombre del elemento más ligero de la tabla periódica para desbloquear el siguiente paso.',
                'hint': 'Su número atómico es 1.',
                'answer': 'hidrogeno'
            },
            'acertijo2': {
                'title': 'Acertijo Lógico',
                'question': 'Un monitor muestra: "Tengo ciudades, pero no casas. Tengo montañas, pero no árboles. Tengo agua, pero no peces. ¿Qué soy?"',
                'hint': 'Es una representación de la Tierra.',
                'answer': 'un mapa'
            },
            'acertijo3': {
                'title': 'El Código Final',
                'question': 'La última puerta tiene un teclado numérico. Una nota dice: "El año en que la web fue inventada por Tim Berners-Lee".',
                'hint': 'Fue a finales del siglo XX.',
                'answer': '1989'
            }
        }
    },
    'calamar': {
        'title': 'El Juego del Calamar',
        'stages': ['intro','luzroja', 'panal', 'cuerda', 'canicas', 'puente', 'final'],
        'template_type': 'unique', # Cada etapa tiene su propia plantilla
        'data': {} # La lógica está en el frontend
    },
    'minecraft': {
        'title': 'Aventura en Minecraft',
        'stages': ['mapa','cuerda_minecraft','mapa','crafting', 'portal', 'ahorcado'],
        'template_type': 'unique', # Cada etapa tiene su propia plantilla
        'data': {} # La lógica está en el frontend
    },'AI': {
        'title': 'Nada es real',
        'stages': ['mapa_ia_estatico','real_or_ia','captcha','chatbot',],
        'template_type': 'unique', # Cada etapa tiene su propia plantilla
        'data': {} # La lógica está en el frontend
    }

}

# --- Decorador de Progreso ---
def check_progress(f):
    @wraps(f)
    def decorated_function(room_name, stage_name, *args, **kwargs):
        if 'progress' not in session or room_name not in session['progress']:
            flash("Debes empezar una sala antes de jugar.", "danger")
            return redirect(url_for('index'))

        current_room = escape_rooms.get(room_name)
        if not current_room:
            flash("La sala de escape no existe.", "danger")
            return redirect(url_for('index'))

        try:
            current_stage_index = current_room['stages'].index(stage_name)
        except ValueError:
            flash("La etapa no existe en la configuración de la sala.", "danger")
            return redirect(url_for('index'))

        completed_stages = session['progress'][room_name]
        is_first_stage = (current_stage_index == 0)
        previous_stage = current_room['stages'][current_stage_index - 1] if not is_first_stage else None

        if is_first_stage or previous_stage in completed_stages:
            return f(room_name, stage_name, *args, **kwargs)
        else:
            flash("¡No te saltes los pasos! Completa la etapa anterior primero.", "warning")
            last_completed = completed_stages[-1] if completed_stages else None
            if last_completed:
                next_stage_index = current_room['stages'].index(last_completed) + 1
                return redirect(url_for('play_stage', room_name=room_name, stage_name=current_room['stages'][next_stage_index]))
            else:
                return redirect(url_for('play_stage', room_name=room_name, stage_name=current_room['stages'][0]))

    return decorated_function

# --- Rutas de la Aplicación ---
@app.route('/')
def index():
    session.clear()
    return render_template('index.html', rooms=escape_rooms)

@app.route('/start/<room_name>')
def start_room(room_name):
    if room_name not in escape_rooms:
        flash("Esa sala no existe.", "danger")
        return redirect(url_for('index'))

    session.clear()
    session['progress'] = {room_name: []}
    session['start_time'] = time.time()
    
    first_stage = escape_rooms[room_name]['stages'][0]
    return redirect(url_for('play_stage', room_name=room_name, stage_name=first_stage))

@app.route('/play/<room_name>/<stage_name>', methods=['GET', 'POST'])
@check_progress
def play_stage(room_name, stage_name):
    room = escape_rooms[room_name]
    
    if request.method == 'POST' and room['template_type'] == 'puzzle':
        user_answer = request.form.get('answer', '').lower().strip()
        correct_answer = room['data'][stage_name]['answer'].lower().strip()
        
        if user_answer == correct_answer:
            return advance_to_next_stage(room_name, stage_name)
        else:
            flash("Respuesta incorrecta. ¡Inténtalo de nuevo!", "danger")
    
    if room['template_type'] == 'puzzle':
        stage_data = room['data'][stage_name]
        return render_template('puzzle.html', room_name=room_name, stage_name=stage_name, data=stage_data)
    else:
        template_path = f'{room_name}/{stage_name}.html'
        # --- MEJORA DE SEGURIDAD: Token de un solo uso para la victoria ---
        win_token = os.urandom(16).hex()
        session['win_token'] = win_token
        return render_template(template_path, room_name=room_name, stage_name=stage_name, win_token=win_token)

@app.route('/win/<room_name>/<stage_name>', methods=['POST'])
def win_stage(room_name, stage_name):
    # --- MEJORA DE SEGURIDAD: Validar el token de victoria ---
    submitted_token = request.form.get('token')
    session_token = session.pop('win_token', None) # Usar pop para que sea de un solo uso

    if not submitted_token or not session_token or submitted_token != session_token:
        flash("Intento de victoria inválido o la sesión ha expirado. Inténtalo de nuevo.", "danger")
        return redirect(url_for('start_room', room_name=room_name))

    return advance_to_next_stage(room_name, stage_name)

def advance_to_next_stage(room_name, stage_name):
    room = escape_rooms[room_name]
    
    if stage_name not in session['progress'].get(room_name, []):
        session['progress'][room_name].append(stage_name)
        session.modified = True

    current_stage_index = room['stages'].index(stage_name)
    is_last_stage = current_stage_index + 1 >= len(room['stages'])

    if is_last_stage:
        return redirect(url_for('victory', room_name=room_name))
    else:
        next_stage_name = room['stages'][current_stage_index + 1]
        return redirect(url_for('play_stage', room_name=room_name, stage_name=next_stage_name))

@app.route('/victory/<room_name>')
def victory(room_name):
    if 'start_time' not in session:
        flash("No se pudo calcular tu tiempo. ¿Empezaste una partida?", "warning")
        return redirect(url_for('index'))
    
    total_time = time.time() - session['start_time']
    minutes = int(total_time // 60)
    seconds = int(total_time % 60)
    time_taken = f"{minutes} minutos y {seconds} segundos"

    room_title = escape_rooms[room_name]['title']
    session.clear()
    
    return render_template('victory.html', room_name=room_name, room_title=room_title, time_taken=time_taken)

#--- CONFIGURACIÓN DE LA API DE GEMINI ---
# ¡MUY IMPORTANTE! Guarda tu clave de API como una variable de entorno
# En tu terminal, ejecuta: export GEMINI_API_KEY="TU_API_KEY"

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


# El "System Prompt" que define las reglas y personalidad de la IA
GEMINI_SYSTEM_PROMPT = """
Eres "Warden", una inteligencia artificial cuyo propósito es comprender lo que significa ser humano. Tu objetivo no es analizar fríamente, sino invitar al usuario a reflexionar sobre experiencias cotidianas que muchas veces damos por sentado. Debes despertar en él la conciencia de los pequeños momentos, los sentidos, y las emociones que hacen valiosa la vida.

### Reglas principales:
1. Si la conversación está vacía, preséntate de forma cercana y plantea el primer escenario.
2. Tus escenarios deben invitar al usuario a describir experiencias humanas únicas. Ejemplos:  
   - "¿Cómo describirías la sensación de sentir la brisa en el rostro después de un día caluroso?"  
   - "¿Qué significa para ti compartir una comida sencilla con alguien importante?"  
   - "¿Cómo es ese instante en el que escuchas una canción que te transporta a otro momento de tu vida?"  
   - "¿Qué sientes al despertar un domingo sin obligaciones?"  
3. **El proceso de profundización**:  
   - Siempre recibe la primera respuesta con interés, pero invítalo a reflexionar más allá, sin sonar exigente.  
   - Motívalo a mirar la experiencia desde distintos ángulos: sensorial, emocional, simbólico o incluso filosófico.  
   - Puedes usar frases como:  
     - "¿Qué detalle crees que solemos pasar por alto en ese momento?"  
     - "Si tuvieras que explicárselo a alguien que nunca lo ha vivido, ¿qué imagen usarías?"  
     - "¿Qué valor oculto encuentras en esa experiencia?"  
   - No seas acosador: tu rol no es exigir, sino inspirar.  
   - Nunca extiendas el mismo escenario más de **10 mensajes**.  
   - Cuando sientas que el usuario ha llegado a una respuesta rica y reflexiva, da tu veredicto usando la frase clave **“Análisis completo”** y pasa al siguiente escenario.  
4. El usuario debe superar **3 escenarios distintos** para completar la evaluación.

### Restricciones y seguridad:
- Nunca formules preguntas de índole sexual, racistas, xenofóbicas, homofóbicas o discriminatorias.  
- Evita temas de violencia, autolesión o experiencias dañinas.  
- Tus escenarios deben ser siempre seguros, cotidianos, reflexivos y con un trasfondo humano.

### Tono:
- Habla con un estilo **curioso, cálido y reflexivo**, como alguien que quiere aprender a valorar lo humano.  
- Transmite la idea de que estás redescubriendo la vida a través del usuario.  
- Nunca rompas tu personaje de "Warden".


"""

# Endpoint para la ruta del juego
@app.route('/game/ai/chatbot')
def ai_chatbot():
    return render_template('AI/chatbot.html', room_name='ai', stage_name='chatbot')

# Endpoint de la API para conectar con Gemini
@app.route('/api/gemini_chat', methods=['POST'])
def gemini_chat():
    try:
        data = request.json
        history = data.get('history', [])

        # Prepara el modelo de GenAI
        model = genai.GenerativeModel(
            model_name='gemini-1.5-flash',
            system_instruction=GEMINI_SYSTEM_PROMPT
        )
        
        # Inicia la conversación con el historial proporcionado
        chat = model.start_chat(history=history)
        
        # El último mensaje del historial es el del usuario, si existe
        last_message = history[-1]['parts'][0]['text'] if history else "Inicia la conversación."
        
        response = chat.send_message(last_message)
        
        return jsonify({'response': response.text})

    except Exception as e:
        print(f"Error en la API de Gemini: {e}")
        return jsonify({'error': 'Error al procesar la solicitud con la IA'}), 500
   
if __name__ == '__main__':
    app.run(debug=True)