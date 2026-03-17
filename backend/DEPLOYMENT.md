# Backend Deployment Guide

This guide covers the deployment of the Flask backend for both Windows (Development/Local) and Linux (Production-ready).

---

## 🛠️ Prerequisites

- **Python**: 3.14+ (Recommended)
- **PostgreSQL**: 15+ (Running on port 5433 by default)
- **Git**: For cloning/updating the codebase

---

## 🪟 Windows Deployment (Local/Dev)

### 1. Database Setup
Ensure PostgreSQL is running on port **5433**.
1. Create the database: `CREATE DATABASE kanban_db;`
2. Ensure the user `postgres` has the password `123456asd` (or update `.env`).

### 2. Environment Setup
From the `backend/` directory:
```powershell
# Create virtual environment
python -m venv venv

# Activate and install dependencies
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Initialize & Seed
```powershell
python seed.py
```

### 4. Run Server
```powershell
python app.py
```
The server will be available at `http://localhost:5000` or `http://<your-ip>:5000`.

---

## 🐧 Linux Deployment (Gunicorn + Systemd)

### 1. Server Preparation
```bash
sudo apt update && sudo apt install python3-pip python3-venv postgresql postgresql-contrib
```

### 2. Database Configuration
Ensure the `kanban_db` exists and the user has correct permissions.

### 3. Application Setup
Upload the `backend/` folder to `/var/www/kanban/backend`.
```bash
cd /var/www/kanban/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Systemd Service File
Create a service file to run the backend in the background:
`sudo nano /etc/systemd/system/kanban-backend.service`

**Content:**
```ini
[Unit]
Description=Gunicorn instance to serve Kanban Backend
After=network.target

[Service]
User=root
Group=www-data
WorkingDirectory=/var/www/kanban/backend
Environment="PATH=/var/www/kanban/backend/venv/bin"
ExecStart=/var/www/kanban/backend/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:5000 wsgi:app

[Install]
WantedBy=multi-user.target
```

### 5. Start & Enable
```bash
sudo systemctl start kanban-backend
sudo systemctl enable kanban-backend
```

### 6. Verify
```bash
sudo systemctl status kanban-backend
```

---

## ⚙️ Configuration (.env)
Create a `.env` file in the `backend/` directory to override defaults:
```env
DB_USER=postgres
DB_PASS=123456asd
DB_HOST=localhost
DB_PORT=5433
DB_NAME=kanban_db
SECRET_KEY=your_very_secret_key
```
