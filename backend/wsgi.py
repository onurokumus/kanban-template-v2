"""Gunicorn entry point for Linux deployment.
Usage: gunicorn -w 4 -b 0.0.0.0:5104 wsgi:app
"""
from app import create_app

app = create_app()
