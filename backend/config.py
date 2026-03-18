import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'kanban-dev-secret-key-change-in-prod')

    # PostgreSQL
    DB_USER = os.environ.get('DB_USER', 'postgres')
    DB_PASS = os.environ.get('DB_PASS', '123456asd')
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = os.environ.get('DB_PORT', '5433')
    DB_NAME = os.environ.get('DB_NAME', 'kanban_db')

    SQLALCHEMY_DATABASE_URI = (
        f"postgresql+psycopg://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Session — login once, stay logged in for 30 days
    REMEMBER_COOKIE_DURATION = timedelta(days=30)
    PERMANENT_SESSION_LIFETIME = timedelta(days=30)
    SESSION_COOKIE_PATH = '/k11c0_kezban'
    SESSION_COOKIE_NAME = 'kanban_kezban_session'
