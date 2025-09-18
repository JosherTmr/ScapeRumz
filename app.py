import time
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_compress import Compress
import os
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)
compress = Compress(app)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 31536000
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
    'squid': {
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
        # --- REFACTORIZACIÓN DE RUTA ---
        # La ruta ahora apunta a la subcarpeta 'games'
        template_path = f'games/{room_name}/{stage_name}.html'
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

import random

# --- LÓGICA DE JUEGO MOVIDA AL BACKEND ---

# --- Juego 4 (AI): Laberinto del Búnker ---
BUNKER_MAP_DATA = {
    'map': [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
        [1,1,1,0,0,5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
        [1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
        [1,0,1,4,0,0,1,1,1,1,5,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
        [1,0,1,1,1,0,1,1,1,1,0,0,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
        [1,0,0,0,0,0,1,1,4,1,1,1,0,0,0,1,4,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
        [1,4,0,1,0,0,2,0,0,0,0,0,0,1,0,0,0,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
        [1,1,1,1,4,0,1,1,0,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
        [1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,4,0,0,0,4,1,1,1,1,1,1,1,4,4,1,1,1,1,],
        [1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,4,0,1,1,1,0,0,0,0,0,1,1,1,1,1,1,4,0,0,4,4,1,1,],
        [1,1,1,1,1,1,1,0,0,0,1,1,1,1,0,0,0,1,1,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,4,1,1,],
        [1,1,1,4,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,5,0,4,1,1,],
        [1,1,1,0,0,4,1,0,0,0,1,1,1,1,0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,1,1,4,0,0,4,4,1,1,],
        [1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,4,0,0,0,4,1,1,1,1,1,1,1,4,4,1,1,1,1,],
        [1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
        [1,1,1,1,4,0,0,1,0,0,0,4,1,1,1,0,1,1,1,1,1,0,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
        [1,1,1,1,4,5,0,2,0,0,0,0,1,1,1,0,1,1,1,1,1,0,1,1,1,3,0,1,1,1,1,1,1,1,1,1,1,1,],
        [1,1,1,1,4,0,0,1,0,0,0,0,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,],
        [1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,],
        [1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,4,0,0,2,0,0,1,1,1,1,1,1,1,1,1,1,1,],
        [1,1,1,1,1,1,1,1,0,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,4,1,1,1,1,1,1,1,1,1,1,1,],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,]
    ],
    'puzzle_bank': [
        { 'type': 'belongs-or-no', 'prompt': "Sistema: Selecciona la(s) imagen(es) que no pertenece(n) al grupo", 'images': ['/captcha_ai/gomitas1.jpg','/captcha_ai/gomitas2.jpg','/captcha_ai/gomitas3.jpg','/captcha_ai/gomitas4.jpg','/captcha_ai/gomitas5.jpg','/captcha_ai/gomitas6.jpg','/captcha_ai/gomitas7.jpg','/captcha_ai/gomitas8.jpg','/captcha_ai/gomitas9.jpg'], 'correctIndices': [8] },
        { 'type': 'belongs-or-no2', 'prompt': "Sistema: Selecciona la(s) imagen(es) que no pertenece(n) al grupo.", 'images': ['/captcha_ai/limas.jpg','/captcha_ai/lime.jpg','/captcha_ai/limones.jpg','/captcha_ai/mandarinas.jpg','/captcha_ai/manodebuda.jpg','/captcha_ai/maracuya.jpg','/captcha_ai/naranjas.jpg','/captcha_ai/papaya.jpg','/captcha_ai/pomelos.jpg'], 'correctIndices': [5,7] },
        { 'type': 'belongs-or-no3', 'prompt': "Sistema: Selecciona la(s) imagen(es) que no pertenece(n) al grupo.", 'images': ['/captcha_ai/cupcake5.jpg','/captcha_ai/cupcake4.jpg','/captcha_ai/cupcake2.jpg','/captcha_ai/cupcake9.jpg','/captcha_ai/cupcake8.jpg','/captcha_ai/cupcake7.jpg','/captcha_ai/cupcake1.jpg','/captcha_ai/cupcake6.jpg','/captcha_ai/cupcake3.jpg'], 'correctIndices': [3,4] },
        { 'type': 'belongs-or-no4', 'prompt': "Sistema: Elige solo los numeros primos", 'images': ['/captcha_ai/numeros2.jpg','/captcha_ai/numeros9.jpg','/captcha_ai/numeros7.png','/captcha_ai/numeros5.jpg','/captcha_ai/numeros1.jpg','/captcha_ai/numeros8.png','/captcha_ai/numeros6.jpg','/captcha_ai/numeros4.jpg','/captcha_ai/numeros3.jpg'], 'correctIndices': [0,4,7,8] }
    ],
    'puzzles': {
        "5,1": { "doorKey": "6,6", "name": "Alpha" },
        "33,11": { "doorKey": "12,4", "name": "Beta" },
        "10,3": { "doorKey": "7,16", "name": "Gamma" },
        "5,16": { "doorKey": "24,19", "name": "Exit" }
    }
}

@app.route('/api/ai/map/start', methods=['POST'])
def start_bunker_game():
    # Setup Puzzles
    puzzles = {}
    puzzle_bank = random.sample(BUNKER_MAP_DATA['puzzle_bank'], len(BUNKER_MAP_DATA['puzzles']))
    for (key, puzzle_def), puzzle_data in zip(BUNKER_MAP_DATA['puzzles'].items(), puzzle_bank):
        puzzles[key] = {**puzzle_def, 'puzzle': puzzle_data, 'solved': False}

    # Setup Doors
    doors = {p['doorKey']: {'open': False} for p in puzzles.values()}

    # Setup Trap Offsets
    trap_offsets = {}
    for y, row in enumerate(BUNKER_MAP_DATA['map']):
        for x, tile_type in enumerate(row):
            if tile_type == 4:
                trap_offsets[f"{x},{y}"] = random.random() * 4

    session['bunker_game'] = {
        'map': BUNKER_MAP_DATA['map'],
        'player': { 'x': 1, 'y': 2, 'lives': 4 },
        'puzzles': puzzles,
        'doors': doors,
        'unlocked_keys': [],
        'start_time': time.time(),
        'trap_offsets': trap_offsets # Guardar los desfases de las trampas
    }
    session.modified = True
    return jsonify(session['bunker_game'])

@app.route('/api/ai/map/move', methods=['POST'])
def move_bunker_player():
    game = session.get('bunker_game')
    if not game: return jsonify({'error': 'Game not started'}), 400

    dx = request.json.get('dx', 0)
    dy = request.json.get('dy', 0)

    player = game['player']
    nx, ny = player['x'] + dx, player['y'] + dy

    # Basic validation
    if not (0 <= nx < 38 and 0 <= ny < 22):
        return jsonify({'error': 'Move out of bounds'}), 400

    tile_type = game['map'][ny][nx]
    log_message = ""
    game_over = False
    win = False
    effects = [] # Lista de efectos visuales para el frontend

    if tile_type == 1: # Wall
        game['effects'] = effects
        return jsonify(game)

    key = f"{nx},{ny}"
    if tile_type == 2 and not game['doors'].get(key, {}).get('open', False):
        log_message = f"ALERTA: Puerta {key} sellada."
        game['log_message'] = log_message
        game['effects'] = effects
        return jsonify(game)

    # Valid move, update position
    player['x'], player['y'] = nx, ny

    if tile_type == 3: # Goal
        log_message = "¡Has alcanzado el búnker de seguridad!"
        game_over = True
        win = True
    elif tile_type == 4: # Trap
        # Lógica de trampa basada en tiempo y desfase individual
        offset = game.get('trap_offsets', {}).get(key, 0)
        time_since_start = time.time() - game['start_time']
        # Ciclo de 4 segundos: 2s activada, 2s desactivada
        is_trap_active = ((time_since_start + offset) % 4) < 2

        if is_trap_active:
            player['lives'] -= 1
            log_message = "¡Peligro! Has pisado una trampa activa. Vidas -1."
            effects.append('shake') # Añadir efecto shake
            if player['lives'] <= 0:
                game_over = True
                win = False
    elif tile_type == 5: # Clue
        puzzle = game['puzzles'].get(key)
        if puzzle and not puzzle.get('solved'):
            log_message = f"Terminal {puzzle['name']} detectado. Esperando hackeo."
            # The client will now open the modal. The puzzle data is already on the client.

    game['log_message'] = log_message
    game['game_over'] = game_over
    game['win'] = win
    game['effects'] = effects
    session['bunker_game'] = game
    session.modified = True
    return jsonify(game)

@app.route('/api/ai/map/solve_puzzle', methods=['POST'])
def solve_bunker_puzzle():
    game = session.get('bunker_game')
    if not game: return jsonify({'error': 'Game not started'}), 400

    puzzle_key = request.json.get('puzzle_key')
    selected_indices = request.json.get('selected_indices')

    puzzle_info = game['puzzles'].get(puzzle_key)
    if not puzzle_info: return jsonify({'error': 'Invalid puzzle key'}), 400

    correct_indices = puzzle_info['puzzle']['correctIndices']
    is_correct = (len(correct_indices) == len(selected_indices) and
                  all(i in selected_indices for i in correct_indices))

    if is_correct:
        puzzle_info['solved'] = True
        door_key = puzzle_info['doorKey']
        if door_key in game['doors']:
            game['doors'][door_key]['open'] = True
        game['unlocked_keys'].append(puzzle_info['name'])
        log_message = f"Verificación humana exitosa. Llave de acceso \"{puzzle_info['name']}\" obtenida."
    else:
        game['player']['lives'] -= 1
        log_message = "Verificación fallida. La IA ha reforzado sus defensas."
        if game['player']['lives'] <= 0:
            game['game_over'] = True
            game['win'] = False

    game['log_message'] = log_message
    session['bunker_game'] = game
    session.modified = True
    return jsonify(game)


# --- Juego 3 (Minecraft): Mapa del Santuario ---
MINECRAFT_MAP_DATA = {
    'map': [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,4,0,0,5,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,1,4,4,4,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,4,1,1,1,0,1,1,1,1,1,1,4,4,4,1,1,1,1,1,1,4,0,0,0,4,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,4,0,0,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,0,0,0,5,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1],
        [1,1,1,1,0,0,0,0,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1],
        [1,1,1,1,0,3,0,0,2,0,1,1,0,0,0,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1],
        [1,1,1,1,0,0,0,0,1,0,1,1,1,1,0,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,4,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,0,5,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    'riddles': {
        "32,2": { "question": "Resuelve: 15 * 12 / 3", "answer": "60", "doorKey": "12,13" },
        "32,14": { "question": "Binario a decimal: 1101", "answer": "13", "doorKey": "18,18" },
        "18,20": { "question": "Si f(x)=2x+3, ¿cuánto vale f(7)?", "answer": "17", "doorKey": "8,17" }
    }
}

@app.route('/api/minecraft/map/start', methods=['POST'])
def start_minecraft_map_game():
    doors = {r['doorKey']: {'open': False} for r in MINECRAFT_MAP_DATA['riddles'].values()}

    # --- REFACTOR: Add dynamic traps logic from AI game ---
    trap_offsets = {}
    for y, row in enumerate(MINECRAFT_MAP_DATA['map']):
        for x, tile_type in enumerate(row):
            if tile_type == 4: # It's a trap
                trap_offsets[f"{x},{y}"] = random.random() * 4 # Random offset for unique cycle

    session['minecraft_map_game'] = {
        'map': MINECRAFT_MAP_DATA['map'],
        'player': {'x': 2, 'y': 10, 'lives': 3},
        'doors': doors,
        'riddles': MINECRAFT_MAP_DATA['riddles'],
        'found_riddles': {},
        'start_time': time.time(),
        'trap_offsets': trap_offsets # Store the offsets
    }
    session.modified = True

    game_state = {k: v for k, v in session['minecraft_map_game'].items()}
    return jsonify({k: v for k, v in game_state.items() if k != 'riddles'})

@app.route('/api/minecraft/map/move', methods=['POST'])
def move_minecraft_player():
    game = session.get('minecraft_map_game')
    if not game: return jsonify({'error': 'Game not started'}), 400

    dx = request.json.get('dx', 0); dy = request.json.get('dy', 0)
    player = game['player']
    nx, ny = player['x'] + dx, player['y'] + dy

    if not (0 <= nx < 38 and 0 <= ny < 22): return jsonify({'error': 'Move out of bounds'}), 400

    tile_type = game['map'][ny][nx]
    log_message = ""
    game_over, win, effects = False, False, []

    if tile_type == 1: # Wall
        return jsonify(game)

    key = f"{nx},{ny}"
    if tile_type == 2 and not game['doors'].get(key, {}).get('open', False):
        log_message = "La puerta está cerrada."
    else:
        player['x'], player['y'] = nx, ny
        if tile_type == 3:
            log_message, game_over, win = "¡Encontraste la meta! ¡Has escapado!", True, True
        elif tile_type == 4:
            # --- REFACTOR: Use time-based trap logic ---
            offset = game.get('trap_offsets', {}).get(key, 0)
            time_since_start = time.time() - game['start_time']
            # Cycle of 4 seconds: 2s active, 2s inactive
            is_trap_active = ((time_since_start + offset) % 4) < 2

            if is_trap_active:
                player['lives'] -= 1
                log_message = "¡Caíste en una trampa activa! Pierdes una vida."
                effects.append('shake')
                if player['lives'] <= 0:
                    game_over, win = True, False
        elif tile_type == 5:
            riddle = game['riddles'].get(key)
            if riddle and key not in game['found_riddles']:
                game['found_riddles'][key] = riddle
                log_message = f'Hallaste una nota: "{riddle["question"]}"'

    game['log_message'] = log_message
    game['game_over'] = game_over
    game['win'] = win
    game['effects'] = effects
    session['minecraft_map_game'] = game
    session.modified = True
    return jsonify({k: v for k, v in game.items()})

@app.route('/api/minecraft/map/state', methods=['GET'])
def get_minecraft_map_state():
    game = session.get('minecraft_map_game')
    if not game:
        return jsonify({'error': 'Game not started'}), 400

    time_now = time.time()
    time_since_start = time_now - game['start_time']

    active_traps = {}
    for key, offset in game.get('trap_offsets', {}).items():
        is_trap_active = ((time_since_start + offset) % 4) < 2
        active_traps[key] = is_trap_active

    return jsonify({'active_traps': active_traps})

@app.route('/api/minecraft/map/solve', methods=['POST'])
def solve_minecraft_map_riddle():
    game = session.get('minecraft_map_game')
    if not game: return jsonify({'error': 'Game not started'}), 400

    code = request.json.get('code', '').lower().strip()
    log_message = f"El código '{code}' no parece correcto para ningún acertijo que hayas encontrado."
    found_match = False

    # REFACTOR: Check the code against all *found* riddles, not adjacent tiles.
    for riddle_key, riddle_data in game.get('found_riddles', {}).items():
        if code == riddle_data.get('answer', '').lower():
            door_key = riddle_data.get('doorKey')
            if door_key and door_key in game['doors']:
                if not game['doors'][door_key]['open']:
                    game['doors'][door_key]['open'] = True
                    log_message = f"¡Correcto! El código '{code}' ha abierto una puerta."
                else:
                    log_message = f"El código '{code}' es correcto, pero la puerta ya estaba abierta."
                found_match = True
                break

    if not found_match and code:
        player = game.get('player')
        if player:
            player['lives'] = max(0, player.get('lives', 1) - 1)
            log_message += " Has perdido una vida por el intento fallido."
            if player['lives'] <= 0:
                game['game_over'] = True
                game['win'] = False


    game['log_message'] = log_message
    session['minecraft_map_game'] = game
    session.modified = True
    return jsonify(game)


# --- Juego 1 (Squid): Luz Roja, Luz Verde ---
LUZ_ROJA_CONFIG = {
    'duration': 30,
    'progress_needed': 100,
    'progress_per_run': 4
}

@app.route('/api/squid/luzroja/start', methods=['POST'])
def start_luz_roja():
    session['luzroja_game'] = {
        'progress': 0,
        'start_time': time.time(),
        'light_state': 'green',
        'next_change': time.time() + (random.random() * 2 + 1.5) # Initial green light duration
    }
    session.modified = True
    return jsonify({
        'timeLeft': LUZ_ROJA_CONFIG['duration'],
        'lightState': 'green',
        'progress': 0
    })

@app.route('/api/squid/luzroja/state', methods=['GET'])
def get_luz_roja_state():
    game = session.get('luzroja_game')
    if not game:
        return jsonify({'error': 'Game not started'}), 400

    time_now = time.time()
    time_left = (game['start_time'] + LUZ_ROJA_CONFIG['duration']) - time_now

    if time_left <= 0:
        return jsonify({'game_over': True, 'win': False, 'message': '¡Se acabó el tiempo!', 'light_state': 'red', 'time_left': 0})

    # Update light state based on time
    if time_now > game['next_change']:
        current_light = game.get('light_state', 'green')
        if current_light == 'green':
            game['light_state'] = 'yellow'
            game['next_change'] = time_now + 0.75  # Yellow light is quick
        elif current_light == 'yellow':
            game['light_state'] = 'red'
            game['next_change'] = time_now + (random.random() * 1.5 + 1)  # Red light duration
        elif current_light == 'red':
            game['light_state'] = 'green'
            game['next_change'] = time_now + (random.random() * 2 + 1.5) # Green light duration
        session.modified = True

    return jsonify({
        'light_state': game['light_state'],
        'time_left': round(time_left),
        'progress': game['progress'],
        'game_over': False
    })


@app.route('/api/squid/luzroja/run', methods=['POST'])
def run_luz_roja():
    game = session.get('luzroja_game')
    if not game:
        return jsonify({'error': 'Game not started'}), 400

    # Check if the player ran during a red or yellow light
    # This state is updated by the /state endpoint, so it's the most recent state
    if game.get('light_state') != 'green':
        return jsonify({'game_over': True, 'win': False, 'message': '¡Te moviste con la luz incorrecta!'})

    # If the light is green, increase progress
    game['progress'] += LUZ_ROJA_CONFIG['progress_per_run']

    win = game['progress'] >= LUZ_ROJA_CONFIG['progress_needed']
    game_over = win

    session['luzroja_game'] = game
    session.modified = True

    return jsonify({
        'new_progress': game['progress'],
        'game_over': game_over,
        'win': win,
        'message': '¡Sigue corriendo!' if not win else '¡Has llegado a la meta!'
    })

# --- Juego 1 (AI): ¿Real o IA? ---
REAL_OR_AI_IMAGE_BANK = [
    {'file': 'CANDLE.png', 'type': 'ia'}, {'file': 'CAR.png', 'type': 'ia'},
    {'file': 'STREET_ART.png', 'type': 'ia'}, {'file': 'MUSEUM.png', 'type': 'ia'},
    {'file': 'MUSEUM_ROBOT.png', 'type': 'ia'}, {'file': 'FISH.png', 'type': 'ia'},
    {'file': 'PARROT.png', 'type': 'ia'}, {'file': 'HORSE.png', 'type': 'ia'},
    {'file': 'DOG.png', 'type': 'ia'}, {'file': 'CAT.png', 'type': 'ia'},
    {'file': 'BEACH.png', 'type': 'ia'}, {'file': 'TEMPLE.png', 'type': 'ia'},
    {'file': 'CITY.png', 'type': 'ia'}, {'file': 'LAKE.png', 'type': 'ia'},
    {'file': 'STREET.png', 'type': 'ia'}, {'file': 'BOOKS.png', 'type': 'ia'},
    {'file': 'SHOES.png', 'type': 'ia'}, {'file': 'CAKE.png', 'type': 'ia'},
    {'file': 'COFEE.png', 'type': 'ia'}, {'file': 'FOOD.png', 'type': 'ia'},
    {'file': 'GUY.png', 'type': 'ia'}, {'file': 'KID.png', 'type': 'ia'},
    {'file': 'BEACH_COUPLE.png', 'type': 'ia'}, {'file': 'OLD_MAN.png', 'type': 'ia'},
    {'file': 'WOMAN.png', 'type': 'ia'}, {'file': 'ART_SHOW.jpg', 'type': 'real'},
    {'file': 'BOOOKS.jpg', 'type': 'real'}, {'file': 'ESTAMADREQUENOSECOMOSELLAMA.jpg', 'type': 'real'},
    {'file': 'HAPPY_MAN.jpg', 'type': 'real'}, {'file': 'KIDS.jpg', 'type': 'real'},
    {'file': 'OWL.jpg', 'type': 'real'}, {'file': 'CAR_ADVENTURE.jpg', 'type': 'real'},
    {'file': 'COOKIES.jpg', 'type': 'real'}, {'file': 'FOOOD.jpg', 'type': 'real'},
    {'file': 'FOOOOD.jpg', 'type': 'real'}, {'file': 'ART.jpg', 'type': 'real'},
    {'file': 'BIRD.jpg', 'type': 'real'}, {'file': 'KISINGCOUPLE.jpg', 'type': 'real'},
    {'file': 'PAINTING_MAN.jpg', 'type': 'real'}, {'file': 'SHOEES.jpg', 'type': 'real'},
    {'file': 'CAMERAMAN.jpg', 'type': 'real'}, {'file': 'GIRL.jpg', 'type': 'real'},
    {'file': 'PELICANO.jpg', 'type': 'real'}, {'file': 'ZORRO.jpg', 'type': 'real'},
    {'file': 'CALLE.jpg', 'type': 'real'}, {'file': 'VELAS.jpg', 'type': 'real'},
    {'file': 'TEMPLO.jpg', 'type': 'real'}, {'file': 'BEACHMAN.jpg', 'type': 'real'},
    {'file': 'WOW.jpg', 'type': 'real'}, {'file': 'BOAT.jpg', 'type': 'real'}
]

@app.route('/api/ai/real_or_ai/start', methods=['POST'])
def start_real_or_ai_game():
    image_set = random.sample(REAL_OR_AI_IMAGE_BANK, 10)
    session['real_or_ai_game'] = {
        'images': image_set,
        'score': 0,
        'lives': 3,
        'current_index': 0,
        'images_to_win': 10
    }
    session.modified = True

    first_image = session['real_or_ai_game']['images'][0]['file']
    return jsonify({'image_file': first_image})

@app.route('/api/ai/real_or_ai/guess', methods=['POST'])
def real_or_ai_guess():
    game = session.get('real_or_ai_game')
    if not game:
        return jsonify({'error': 'Game not started'}), 400

    guess = request.json.get('guess')
    current_index = game['current_index']

    correct_answer = game['images'][current_index]['type']
    is_correct = (guess == correct_answer)

    if is_correct:
        game['score'] += 1
    else:
        game['lives'] -= 1

    game['current_index'] += 1

    game_over = game['lives'] <= 0 or game['score'] >= game['images_to_win'] or game['current_index'] >= len(game['images'])
    win = game['score'] >= game['images_to_win'] and game['lives'] > 0

    response = {
        'correct': is_correct,
        'new_score': game['score'],
        'new_lives': game['lives'],
        'game_over': game_over,
        'win': win
    }

    if not game_over:
        response['next_image_file'] = game['images'][game['current_index']]['file']

    session['real_or_ai_game'] = game
    session.modified = True

    return jsonify(response)


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
    # This route is now deprecated and will be handled by play_stage.
    # It can be removed, but we'll redirect for now to be safe.
    return redirect(url_for('play_stage', room_name='ai', stage_name='chatbot'))

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

with app.app_context():
    app.jinja_env.compile_templates(target='__pycache__', zip=None, log_function=print)

if __name__ == '__main__':
    app.run(debug=True)