from flask import Flask, request
from flask_login import LoginManager
from config import Config
from models import db, User
from auth import auth_bp
from routes.tasks import tasks_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS — allow any origin on dev ports (credentials require explicit origin, not *)
    @app.after_request
    def cors(response):
        origin = request.headers.get('Origin', '')
        allowed_ports = [':5173', ':4173']
        if any(origin.endswith(p) for p in allowed_ports) or origin in ('http://localhost:5173', 'http://127.0.0.1:5173'):
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        return response

    # Database
    db.init_app(app)

    # Login manager
    login_manager = LoginManager()
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(user_id)

    @login_manager.unauthorized_handler
    def unauthorized():
        from flask import jsonify
        return jsonify({'error': 'Authentication required'}), 401

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(tasks_bp)

    # Create tables on first run
    with app.app_context():
        db.create_all()

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
