import pytest
from app import app as flask_app, LUZ_ROJA_NUEVO_CONFIG
import time

@pytest.fixture
def app():
    flask_app.config.update({
        "TESTING": True,
        "SECRET_KEY": "test_secret_key"
    })
    yield flask_app

@pytest.fixture
def client(app):
    return app.test_client()

def test_index(client):
    """Test the index page."""
    rv = client.get('/')
    assert rv.status_code == 200
    assert b'El Juego del Calamar' in rv.data
    assert b'Aventura en Minecraft' in rv.data
    assert b'Enigma de Inteligencia Artificial' in rv.data

def test_start_room(client):
    """Test starting a valid room."""
    rv = client.get('/start/squid')
    assert rv.status_code == 302
    assert rv.headers['Location'] == '/play/squid/intro'
    with client.session_transaction() as session:
        assert 'progress' in session
        assert 'squid' in session['progress']
        assert not session['progress']['squid']
        assert 'start_time' in session

def test_start_invalid_room(client):
    """Test starting an invalid room."""
    rv = client.get('/start/nonexistent')
    assert rv.status_code == 302
    assert rv.headers['Location'] == '/'

def test_victory_page_no_session(client):
    """Test accessing victory page without a session."""
    rv = client.get('/victory/squid')
    assert rv.status_code == 302
    assert rv.headers['Location'] == '/'

def test_victory_page_with_session(client):
    """Test the victory page with a valid session and that it clears the session."""
    with client:
        client.get('/start/squid') # Start a room to initialize session
        with client.session_transaction() as session:
            session['start_time'] = time.time() - 85 # 1 minute 25 seconds

        rv = client.get('/victory/squid')
        assert rv.status_code == 200
        assert b'Victoria' in rv.data
        assert b'El Juego del Calamar' in rv.data
        assert b'1 minutos y 25 segundos' in rv.data

        # Check that session is now cleared
        with client.session_transaction() as session:
            assert not session

# --- Tests for Squid Room ---

def test_panal_start(client):
    """Test the start of the panal game."""
    with client:
        client.get('/start/squid') # Need to be in a room
        rv = client.post('/api/squid/panal/start')
        assert rv.status_code == 200
        json_data = rv.get_json()
        assert 'config' in json_data
        assert 'puzzle' in json_data
        with client.session_transaction() as session:
            assert 'panal_game' in session
            assert session['panal_game']['lives'] == 3

def test_panal_check_correct(client):
    """Test a correct move in the panal game."""
    with client:
        client.get('/start/squid')
        rv = client.post('/api/squid/panal/start')
        first_puzzle_answer = rv.get_json()['puzzle']['answer']

        rv_check = client.post('/api/squid/panal/check', json={'segment_id': first_puzzle_answer})
        assert rv_check.status_code == 200
        json_data = rv_check.get_json()
        assert json_data['correct'] is True
        assert json_data['new_lives'] == 3
        with client.session_transaction() as session:
            assert session['panal_game']['current_puzzle_index'] == 1

def test_panal_check_incorrect_and_lose(client):
    """Test an incorrect move and losing the game."""
    with client:
        client.get('/start/squid')
        client.post('/api/squid/panal/start')

        for i in range(3):
            rv_check = client.post('/api/squid/panal/check', json={'segment_id': 'incorrect_id'})
            json_data = rv_check.get_json()
            assert json_data['correct'] is False
            assert json_data['new_lives'] == 2 - i

        assert json_data['game_over'] is True
        assert json_data['win'] is False

def test_luzroja_start(client):
    """Test starting the luz roja game."""
    with client:
        client.get('/start/squid')
        rv = client.post('/api/squid/luzroja/start')
        assert rv.status_code == 200
        assert 'map' in rv.get_json()
        with client.session_transaction() as session:
            assert 'luzroja_game' in session

def test_luzroja_move_green_light(client):
    """Test moving during a green light."""
    with client:
        client.get('/start/squid')
        client.post('/api/squid/luzroja/start')
        with client.session_transaction() as session:
            session['luzroja_game']['light_state'] = 'green'
            session.modified = True

        rv = client.post('/api/squid/luzroja/move', json={'dx': 0, 'dy': -1})
        assert rv.status_code == 200
        with client.session_transaction() as session:
            assert session['luzroja_game']['player_pos']['y'] == 23

def test_luzroja_move_red_light_and_answer_correctly(client):
    """Test moving on red light and answering the question correctly."""
    with client:
        client.get('/start/squid')
        client.post('/api/squid/luzroja/start')

        with client.session_transaction() as session:
            session['luzroja_game']['light_state'] = 'red'
            session.modified = True
            original_pos = session['luzroja_game']['player_pos'].copy()

        rv_move = client.post('/api/squid/luzroja/move', json={'dx': 0, 'dy': -1})
        assert rv_move.status_code == 200
        assert rv_move.get_json()['status'] == 'ask_question'

        with client.session_transaction() as session:
            assert session['luzroja_game']['question_pending'] is not None
            assert session['luzroja_game']['player_pos'] == original_pos
            correct_answer = session['luzroja_game']['question_pending']['answer']

        rv_answer = client.post('/api/squid/luzroja/answer', json={'answer': correct_answer})
        assert rv_answer.status_code == 200

        with client.session_transaction() as session:
            assert session['luzroja_game']['question_pending'] is None
            assert session['luzroja_game']['player_pos'] == original_pos

def test_luzroja_move_red_light_and_answer_incorrectly(client):
    """Test moving on red light and answering incorrectly sends player to start."""
    with client:
        client.get('/start/squid')
        client.post('/api/squid/luzroja/start')

        with client.session_transaction() as session:
            session['luzroja_game']['light_state'] = 'red'
            session.modified = True

        client.post('/api/squid/luzroja/move', json={'dx': 1, 'dy': 0})

        rv_answer = client.post('/api/squid/luzroja/answer', json={'answer': 'this is a wrong answer'})
        assert rv_answer.status_code == 200

        with client.session_transaction() as session:
            assert session['luzroja_game']['question_pending'] is None
            assert session['luzroja_game']['player_pos'] == LUZ_ROJA_NUEVO_CONFIG['start_pos']

# --- Tests for AI Room ---

def test_real_or_ai_start(client):
    """Test starting the 'Real or AI' game."""
    with client:
        client.get('/start/ai')
        rv = client.post('/api/ai/real_or_ai/start')
        assert rv.status_code == 200
        assert 'image_file' in rv.get_json()
        with client.session_transaction() as session:
            assert 'real_or_ai_game' in session
            assert session['real_or_ai_game']['score'] == 0
            assert session['real_or_ai_game']['lives'] == 3

def test_real_or_ai_guess_correctly(client):
    """Test a correct guess in the 'Real or AI' game."""
    with client:
        client.get('/start/ai')
        client.post('/api/ai/real_or_ai/start')

        with client.session_transaction() as session:
            game = session['real_or_ai_game']
            correct_answer = game['images'][game['current_index']]['type']

        rv = client.post('/api/ai/real_or_ai/guess', json={'guess': correct_answer})
        json_data = rv.get_json()

        assert json_data['correct'] is True
        assert json_data['new_score'] == 1
        assert json_data['new_lives'] == 3

def test_real_or_ai_guess_incorrectly(client):
    """Test an incorrect guess in the 'Real or AI' game."""
    with client:
        client.get('/start/ai')
        client.post('/api/ai/real_or_ai/start')

        with client.session_transaction() as session:
            game = session['real_or_ai_game']
            correct_answer = game['images'][game['current_index']]['type']
            incorrect_answer = 'ia' if correct_answer == 'real' else 'real'

        rv = client.post('/api/ai/real_or_ai/guess', json={'guess': incorrect_answer})
        json_data = rv.get_json()

        assert json_data['correct'] is False
        assert json_data['new_score'] == 0
        assert json_data['new_lives'] == 2

def test_guess_number_start(client):
    """Test starting the 'Guess the Number' game."""
    with client:
        client.get('/start/ai')
        rv = client.post('/api/ai/guess_number/start')
        assert rv.status_code == 200
        with client.session_transaction() as session:
            assert 'secret_number' in session
            assert session['attempts_left'] == 10

def test_guess_number_check_correct(client):
    """Test a correct guess in 'Guess the Number'."""
    with client:
        client.get('/start/ai')
        client.post('/api/ai/guess_number/start')
        with client.session_transaction() as session:
            secret = session['secret_number']

        rv = client.post('/api/ai/guess_number/check', json={'guess': secret})
        json_data = rv.get_json()
        assert json_data['status'] == 'correct'

def test_guess_number_check_too_low(client):
    """Test a low guess in 'Guess the Number'."""
    with client:
        client.get('/start/ai')
        client.post('/api/ai/guess_number/start')
        with client.session_transaction() as session:
            secret = session['secret_number']

        rv = client.post('/api/ai/guess_number/check', json={'guess': secret - 1})
        json_data = rv.get_json()
        assert json_data['status'] == 'too_low'
        assert json_data['attempts_left'] == 9

def test_guess_number_check_too_high(client):
    """Test a high guess in 'Guess the Number'."""
    with client:
        client.get('/start/ai')
        client.post('/api/ai/guess_number/start')
        with client.session_transaction() as session:
            secret = session['secret_number']

        rv = client.post('/api/ai/guess_number/check', json={'guess': secret + 1})
        json_data = rv.get_json()
        assert json_data['status'] == 'too_high'
        assert json_data['attempts_left'] == 9

# --- Tests for Minecraft Room ---

def test_minecraft_map_start(client):
    """Test starting the Minecraft map game."""
    with client:
        client.get('/start/minecraft')
        rv = client.post('/api/minecraft/map/start')
        assert rv.status_code == 200
        json_data = rv.get_json()
        assert 'map' in json_data
        assert 'player' in json_data
        with client.session_transaction() as session:
            assert 'minecraft_map_game' in session

def test_minecraft_map_move_valid(client):
    """Test a valid player move on the Minecraft map."""
    with client:
        client.get('/start/minecraft')
        client.post('/api/minecraft/map/start')

        # Player starts at x=2, y=10. Move to x=2, y=9 (empty space)
        rv = client.post('/api/minecraft/map/move', json={'dx': 0, 'dy': -1})
        assert rv.status_code == 200
        with client.session_transaction() as session:
            player = session['minecraft_map_game']['player']
            assert player['x'] == 2
            assert player['y'] == 9

def test_minecraft_map_move_into_wall(client):
    """Test moving into a wall on the Minecraft map."""
    with client:
        client.get('/start/minecraft')
        client.post('/api/minecraft/map/start')

        # Player starts at x=2, y=10. Move to x=1, y=10 (wall)
        rv = client.post('/api/minecraft/map/move', json={'dx': -1, 'dy': 0})
        assert rv.status_code == 200
        with client.session_transaction() as session:
            player = session['minecraft_map_game']['player']
            assert player['x'] == 2 # Position should not change
            assert player['y'] == 10

def test_minecraft_map_find_and_solve_riddle(client):
    """Test finding a riddle and solving it to open a door."""
    with client:
        client.get('/start/minecraft')
        client.post('/api/minecraft/map/start')

        # Move to riddle location 32,2
        with client.session_transaction() as session:
            session['minecraft_map_game']['player']['x'] = 31
            session['minecraft_map_game']['player']['y'] = 2
            session.modified = True

        rv_move = client.post('/api/minecraft/map/move', json={'dx': 1, 'dy': 0})
        assert rv_move.status_code == 200
        with client.session_transaction() as session:
            assert '32,2' in session['minecraft_map_game']['found_riddles']

        # Solve the riddle
        rv_solve = client.post('/api/minecraft/map/solve', json={'code': '60'})
        assert rv_solve.status_code == 200
        with client.session_transaction() as session:
            # Door at 12,13 should now be open
            assert session['minecraft_map_game']['doors']['12,13']['open'] is True