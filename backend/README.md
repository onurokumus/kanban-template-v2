# Kanban Template V2 - Backend

This directory contains the backend API for the Kanban template application. It is built using **Python** and **Flask**, providing a lightweight yet full-featured RESTful API to manage users, tasks, subtasks, and comments.

## Tech Stack
- **Framework:** Flask (Python 3)
- **Database ORM:** Flask-SQLAlchemy (with SQLite by default, via SQLAlchemy)
- **Authentication:** Flask-Login (session-based) & Werkzeug Security (password hashing)
- **CORS:** Flask-Cors (configured to allow local development origins like `localhost:5173`)

## Directory Structure
- `app.py`: The application factory that initializes the Flask app, configures CORS, sets up the database (`db`), and registers blueprints.
- `auth.py`: The authentication blueprint handling user registration, login, logout, and session checks.
- `models.py`: The SQLAlchemy models defining the database schema (`User`, `Task`, `Subtask`, `Comment`).
- `routes/tasks.py`: The tasks blueprint containing all CRUD route handlers for tasks, subtasks, and comments.

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register`: Register a new user with `username`, `password`, and optional `displayName`.
- `POST /login`: Log in an existing user and create a session.
- `POST /logout`: Log out the current user and destroy the session.
- `GET /me`: Get the currently authenticated user's details.

### Tasks (`/api/tasks`)
*Note: All task endpoints require the user to be authenticated.*
- `GET /`: Retrieve all tasks (including their subtasks and comments nested nicely).
- `POST /`: Create a new task. Can optionally accept an array of subtasks and comments to create in bulk.
- `PUT /<task_id>`: Update an existing task's scalar fields (e.g., status, title, assignee, estimated hours, Gantt dates, dependencies).
- `DELETE /<task_id>`: Delete a task (will cascade delete its subtasks and comments).

#### Subtasks
- `POST /<task_id>/subtasks`: Add a new subtask to a task.
- `PUT /<task_id>/subtasks/<sub_id>`: Update a subtask (title, done status, dates).
- `DELETE /<task_id>/subtasks/<sub_id>`: Delete a subtask.
- `PUT /<task_id>/reorder-subtasks`: Reorder the subtasks within a task.

#### Comments
- `POST /<task_id>/comments`: Add a new comment to a task.
- `PUT /<task_id>/comments/<comment_id>`: Update an existing comment (e.g., text, reactions).
- `DELETE /<task_id>/comments/<comment_id>`: Delete a comment.

## Data Models

1. **User**: Stores authentication credentials (`username`, `password_hash`) and profile info (`display_name`).
2. **Task**: The central entity representing a kanban card. Features fields for priorities, tags, task status, assignments, hours estimations, deadlines, dependencies, and epic links to support advanced project management (like Gantt charts).
3. **Subtask**: Associated with a `Task` (1-to-many). Tracks a smaller piece of work (`title`, `done` boolean, and optional dates).
4. **Comment**: Associated with a `Task` (1-to-many). Stores user comments, timestamps, edit history, and reactions.

## Running Locally

Ensure you have Python installed, then install the required dependencies:
```bash
pip install -r requirements.txt
```

Run the application:
```bash
python app.py
```
*The server will start on `http://0.0.0.0:5104` by default. On the first run, `db.create_all()` will automatically create the necessary database tables based on your models.*
