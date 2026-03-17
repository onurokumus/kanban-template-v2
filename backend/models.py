from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
import uuid
from datetime import datetime

db = SQLAlchemy()


class User(db.Model, UserMixin):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    display_name = db.Column(db.String(120))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(255), nullable=False)
    desc = db.Column(db.Text, default='')
    assignee = db.Column(db.String(100), default='Unassigned')
    priority = db.Column(db.String(50), default='Medium')
    tags = db.Column(db.JSON, default=list)
    status = db.Column(db.String(50), default='todo')
    estHours = db.Column(db.Float, default=0.0)
    actualHours = db.Column(db.Float, default=0.0)
    deadline = db.Column(db.String(10))
    ganttStart = db.Column(db.String(10))
    ganttEnd = db.Column(db.String(10))
    completedDate = db.Column(db.String(10))
    progress = db.Column(db.Integer, default=0)
    isEpic = db.Column(db.Boolean, default=False)
    epicId = db.Column(db.String(36), db.ForeignKey('tasks.id'), nullable=True)
    created = db.Column(db.String(10), default=lambda: datetime.utcnow().strftime('%Y-%m-%d'))
    dependencies = db.Column(db.JSON, default=list)  # List of task IDs

    subtasks = db.relationship('Subtask', backref='task', cascade='all, delete-orphan',
                               lazy=True, order_by='Subtask.sort_order')
    comments = db.relationship('Comment', backref='task', cascade='all, delete-orphan',
                               lazy=True, order_by='Comment.ts')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'desc': self.desc,
            'assignee': self.assignee,
            'priority': self.priority,
            'tags': self.tags or [],
            'status': self.status,
            'estHours': self.estHours,
            'actualHours': self.actualHours,
            'deadline': self.deadline,
            'ganttStart': self.ganttStart,
            'ganttEnd': self.ganttEnd,
            'completedDate': self.completedDate,
            'progress': self.progress,
            'isEpic': self.isEpic,
            'epicId': self.epicId,
            'created': self.created,
            'dependencies': self.dependencies or [],
            'subtasks': [s.to_dict() for s in self.subtasks],
            'comments': [c.to_dict() for c in self.comments],
        }


class Subtask(db.Model):
    __tablename__ = 'subtasks'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = db.Column(db.String(36), db.ForeignKey('tasks.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    done = db.Column(db.Boolean, default=False)
    ganttStart = db.Column(db.String(10))
    deadline = db.Column(db.String(10))
    sort_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'done': self.done,
            'ganttStart': self.ganttStart,
            'deadline': self.deadline,
        }


class Comment(db.Model):
    __tablename__ = 'comments'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = db.Column(db.String(36), db.ForeignKey('tasks.id'), nullable=False)
    author = db.Column(db.String(100), nullable=False)
    text = db.Column(db.Text, nullable=False)
    ts = db.Column(db.String(50), nullable=False)
    lastEdited = db.Column(db.String(50))
    reactions = db.Column(db.JSON, default=dict)

    def to_dict(self):
        return {
            'id': self.id,
            'author': self.author,
            'text': self.text,
            'ts': self.ts,
            'lastEdited': self.lastEdited,
            'reactions': self.reactions or {},
        }
