from flask import Blueprint, request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    display_name = data.get('displayName', username)

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    if len(password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409

    user = User(
        username=username,
        password_hash=generate_password_hash(password),
        display_name=display_name
    )
    db.session.add(user)
    db.session.commit()

    login_user(user, remember=True)
    session.permanent = True

    return jsonify({
        'id': user.id,
        'username': user.username,
        'displayName': user.display_name
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')

    user = User.query.filter_by(username=username).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid username or password'}), 401

    login_user(user, remember=True)
    session.permanent = True

    return jsonify({
        'id': user.id,
        'username': user.username,
        'displayName': user.display_name
    })


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'ok': True})


@auth_bp.route('/me', methods=['GET'])
def me():
    if current_user.is_authenticated:
        return jsonify({
            'id': current_user.id,
            'username': current_user.username,
            'displayName': current_user.display_name
        })
    return jsonify(None), 200
