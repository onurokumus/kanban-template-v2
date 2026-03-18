"""Gunicorn entry point for Linux deployment.
Usage (with logging): gunicorn -w 4 -b 0.0.0.0:5104 --access-logfile access.log --error-logfile error.log --log-level debug wsgi:app
"""
from app import create_app

app = create_app()
