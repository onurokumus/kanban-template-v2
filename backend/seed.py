"""Seed the database with sample aero-engineering tasks."""
from app import create_app
from models import db, Task, Subtask, Comment
import uuid

def uid():
    return str(uuid.uuid4())

def seed():
    app = create_app()
    with app.app_context():
        # Clear existing data
        Comment.query.delete()
        Subtask.query.delete()
        Task.query.delete()
        db.session.commit()

        epic_id = uid()

        tasks_data = [
            # ─── IN PROGRESS ──────────────────────────────────────────────
            {
                'id': uid(), 'title': 'Rotor Blade Airloads Analysis',
                'desc': 'Evaluate pressure distribution across main rotor blades during high-speed hover.',
                'assignee': 'Murat', 'priority': 'High', 'tags': ['ATAK', 'UCTON'],
                'status': 'inprogress', 'estHours': 16, 'deadline': '2026-03-22',
                'ganttStart': '2026-03-14', 'ganttEnd': '2026-03-22',
                'created': '2026-03-10', 'progress': 33, 'dependencies': [],
                'subtasks': [
                    {'title': 'Mesh generation', 'done': True, 'ganttStart': '2026-03-14', 'deadline': '2026-03-16'},
                    {'title': 'Solver setup', 'done': False, 'ganttStart': '2026-03-17', 'deadline': '2026-03-19'},
                    {'title': 'Data extraction', 'done': False, 'ganttStart': '2026-03-20', 'deadline': '2026-03-22'},
                ],
                'comments': [
                    {'author': 'Onur', 'text': 'Are we using CFD or simplified BEMT?', 'ts': '2026-03-14T09:00'},
                ],
            },
            # Epic
            {
                'id': epic_id, 'title': 'Vibration Suppression System',
                'desc': 'Optimize active vibration control parameters for GOKBEY airframe.',
                'assignee': 'Onur', 'priority': 'Medium', 'tags': ['GOKBEY'],
                'status': 'inprogress', 'estHours': 8, 'deadline': '2026-03-20',
                'ganttStart': '2026-03-12', 'ganttEnd': '2026-03-20',
                'created': '2026-03-11', 'progress': 66, 'isEpic': True, 'dependencies': [],
            },
            # Epic children
            {'id': uid(), 'epicId': epic_id, 'title': 'Sensor placement', 'desc': 'Determine optimal sensor layout.',
             'assignee': 'Onur', 'priority': 'Medium', 'tags': ['GOKBEY'], 'status': 'completed',
             'estHours': 2, 'deadline': '2026-03-14', 'ganttStart': '2026-03-12', 'ganttEnd': '2026-03-14',
             'created': '2026-03-11', 'completedDate': '2026-03-14', 'progress': 100, 'dependencies': []},
            {'id': uid(), 'epicId': epic_id, 'title': 'Actuator tuning', 'desc': 'Tune the actuators for maximum efficiency.',
             'assignee': 'Onur', 'priority': 'Medium', 'tags': ['GOKBEY'], 'status': 'completed',
             'estHours': 3, 'deadline': '2026-03-17', 'ganttStart': '2026-03-15', 'ganttEnd': '2026-03-17',
             'created': '2026-03-11', 'completedDate': '2026-03-17', 'progress': 100, 'dependencies': []},
            {'id': uid(), 'epicId': epic_id, 'title': 'Software validation', 'desc': 'Validate control software outputs.',
             'assignee': 'Onur', 'priority': 'Medium', 'tags': ['GOKBEY'], 'status': 'inprogress',
             'estHours': 3, 'deadline': '2026-03-20', 'ganttStart': '2026-03-18', 'ganttEnd': '2026-03-20',
             'created': '2026-03-11', 'progress': 20, 'dependencies': []},
            {'id': uid(), 'epicId': epic_id, 'title': 'Data Analysis', 'desc': 'Analyze the output telemetry data.',
             'assignee': 'Onur', 'priority': 'High', 'tags': ['GOKBEY'], 'status': 'inprogress',
             'estHours': 5, 'deadline': '2026-03-22', 'ganttStart': '2026-03-19', 'ganttEnd': '2026-03-22',
             'created': '2026-03-11', 'progress': 10, 'dependencies': []},
            # Regular in-progress tasks
            {'id': uid(), 'title': 'Flight Control Law Update', 'desc': 'Implement new control laws for transition flight in EVTOL prototype.',
             'assignee': 'Mustafa', 'priority': 'Critical', 'tags': ['EVTOL'], 'status': 'inprogress',
             'estHours': 6, 'deadline': '2026-03-20', 'ganttStart': '2026-03-14', 'ganttEnd': '2026-03-20',
             'created': '2026-03-13', 'progress': 20, 'dependencies': []},
            {'id': uid(), 'title': 'Stability Derivative Extraction', 'desc': 'Extract lateral stability derivatives from wind tunnel data.',
             'assignee': 'Enes', 'priority': 'Medium', 'tags': ['KIHA'], 'status': 'inprogress',
             'estHours': 12, 'deadline': '2026-03-25', 'ganttStart': '2026-03-15', 'ganttEnd': '2026-03-25',
             'created': '2026-03-12', 'progress': 30, 'dependencies': []},
            {'id': uid(), 'title': 'Structural Load Testing', 'desc': 'Conduct static load tests on ONTON landing gear assembly.',
             'assignee': 'Berk', 'priority': 'High', 'tags': ['ONTON'], 'status': 'inprogress',
             'estHours': 10, 'deadline': '2026-03-20', 'ganttStart': '2026-03-10', 'ganttEnd': '2026-03-20',
             'created': '2026-03-09', 'progress': 50, 'dependencies': []},
            {'id': uid(), 'title': 'Aeroacoustic Noise Mapping', 'desc': 'Map acoustic signature of rotor hub during hover maneuvers.',
             'assignee': u'İnan', 'priority': 'High', 'tags': ['INFRA', 'UCTON'], 'status': 'inprogress',
             'estHours': 20, 'deadline': '2026-03-26', 'ganttStart': '2026-03-12', 'ganttEnd': '2026-03-26',
             'created': '2026-03-08', 'progress': 40, 'dependencies': []},
            {'id': uid(), 'title': 'Tail Rotor Fatigue Suite', 'desc': 'Bench testing tail rotor assembly for long-term fatigue lifecycle.',
             'assignee': 'Fatih', 'priority': 'Medium', 'tags': ['GOKBEY'], 'status': 'inprogress',
             'estHours': 40, 'deadline': '2026-04-05', 'ganttStart': '2026-03-14', 'ganttEnd': '2026-04-05',
             'created': '2026-03-12', 'progress': 15, 'dependencies': []},
            {'id': uid(), 'title': 'BMS Thermals Check', 'desc': 'Monitor battery management system thermal behavior in EVTOL high-load cycles.',
             'assignee': 'Muratcan', 'priority': 'High', 'tags': ['EVTOL'], 'status': 'inprogress',
             'estHours': 24, 'deadline': '2026-03-28', 'ganttStart': '2026-03-15', 'ganttEnd': '2026-03-28',
             'created': '2026-03-15', 'progress': 10, 'dependencies': []},
            {'id': uid(), 'title': 'Landing Gear Shock Absorption', 'desc': 'Testing shock absorber performance for KIHA emergency landings.',
             'assignee': 'Enes', 'priority': 'Low', 'tags': ['KIHA', 'INFRA'], 'status': 'inprogress',
             'estHours': 14, 'deadline': '2026-03-24', 'ganttStart': '2026-03-16', 'ganttEnd': '2026-03-24',
             'created': '2026-03-14', 'progress': 5, 'dependencies': []},
            {'id': uid(), 'title': 'Ground Resonance Analysis', 'desc': 'Stability check for ground resonance under various lead-lag damper states.',
             'assignee': 'Murat', 'priority': 'Critical', 'tags': ['GOKBEY', 'UCTON'], 'status': 'inprogress',
             'estHours': 18, 'deadline': '2026-03-21', 'ganttStart': '2026-03-15', 'ganttEnd': '2026-03-21',
             'created': '2026-03-14', 'progress': 25, 'dependencies': []},
            {'id': uid(), 'title': 'Flight Test Instrumentation Setup', 'desc': 'Calibrating strain gauges and thermocouples for upcoming flight test campaign.',
             'assignee': 'Mustafa', 'priority': 'High', 'tags': ['ATAK', 'ONTON'], 'status': 'inprogress',
             'estHours': 12, 'deadline': '2026-03-20', 'ganttStart': '2026-03-16', 'ganttEnd': '2026-03-20',
             'created': '2026-03-15', 'progress': 5, 'dependencies': []},
            {'id': uid(), 'title': 'Propulsion Torque Validation', 'desc': 'Verifying e-motor torque limits against structural margins in hover.',
             'assignee': 'Berk', 'priority': 'Medium', 'tags': ['EVTOL'], 'status': 'inprogress',
             'estHours': 14, 'deadline': '2026-03-26', 'ganttStart': '2026-03-16', 'ganttEnd': '2026-03-26',
             'created': '2026-03-15', 'progress': 10, 'dependencies': []},
            {'id': uid(), 'title': 'Hub Drag Breakdown', 'desc': 'Component-level drag analysis for the main rotor hub assembly.',
             'assignee': u'İnan', 'priority': 'Medium', 'tags': ['UCTON', 'GOKBEY'], 'status': 'inprogress',
             'estHours': 20, 'deadline': '2026-03-29', 'ganttStart': '2026-03-16', 'ganttEnd': '2026-03-29',
             'created': '2026-03-14', 'progress': 5, 'dependencies': []},
            {'id': uid(), 'title': 'Blade Tip Vortex Interaction', 'desc': 'High-fidelity simulation of BVI noise during descent profiles.',
             'assignee': 'Muratcan', 'priority': 'Medium', 'tags': ['INFRA'], 'status': 'inprogress',
             'estHours': 24, 'deadline': '2026-03-25', 'ganttStart': '2026-03-16', 'ganttEnd': '2026-03-25',
             'created': '2026-03-15', 'progress': 10, 'dependencies': []},

            # ─── COMPLETED ────────────────────────────────────────────────
            {'id': uid(), 'title': 'Fuselage Drag Reduction', 'desc': 'Optimizing the rear fuselage fairing for ATAK to reduce interference drag.',
             'assignee': 'Onur', 'priority': 'Medium', 'tags': ['ATAK'], 'status': 'completed',
             'estHours': 35, 'deadline': '2026-03-15', 'completedDate': '2026-03-14',
             'created': '2026-03-01', 'progress': 100, 'dependencies': [],
             'subtasks': [
                 {'title': 'Baseline CFD', 'done': True},
                 {'title': 'Fairing geometry tweak', 'done': True},
                 {'title': 'Final report', 'done': True},
             ]},
            {'id': uid(), 'title': 'Main Hub Casting Inspection', 'desc': 'Non-destructive testing and X-ray inspection of the primary rotor hub casting.',
             'assignee': 'Berk', 'priority': 'Critical', 'tags': ['GOKBEY', 'INFRA'], 'status': 'completed',
             'estHours': 20, 'deadline': '2026-03-10', 'completedDate': '2026-03-08',
             'created': '2026-02-25', 'progress': 100, 'dependencies': []},
            {'id': uid(), 'title': 'Avionics Thermal Analysis', 'desc': 'Thermal simulation of the cockpit avionics rack under extreme ambient conditions.',
             'assignee': u'İnan', 'priority': 'Medium', 'tags': ['ONTON'], 'status': 'completed',
             'estHours': 15, 'deadline': '2026-03-12', 'completedDate': '2026-03-11',
             'created': '2026-03-01', 'progress': 100, 'dependencies': []},
            {'id': uid(), 'title': 'KIHA Rotor Head Assembly', 'desc': 'Final assembly and torque check of the KIHA unmanned rotor system.',
             'assignee': 'Enes', 'priority': 'High', 'tags': ['KIHA'], 'status': 'completed',
             'estHours': 18, 'deadline': '2026-03-14', 'completedDate': '2026-03-13',
             'created': '2026-03-05', 'progress': 100, 'dependencies': []},
            {'id': uid(), 'title': 'Pilot Seat Crashworthiness', 'desc': 'Dynamic impact simulation for the new pilot seat design.',
             'assignee': 'Fatih', 'priority': 'Critical', 'tags': ['ATAK'], 'status': 'completed',
             'estHours': 25, 'deadline': '2026-03-05', 'completedDate': '2026-03-04',
             'created': '2026-02-20', 'progress': 100, 'dependencies': []},
            {'id': uid(), 'title': 'EVTOL Battery Drop Test', 'desc': 'Safety validation for the battery module under high-G impact conditions.',
             'assignee': 'Muratcan', 'priority': 'Critical', 'tags': ['EVTOL'], 'status': 'completed',
             'estHours': 12, 'deadline': '2026-03-01', 'completedDate': '2026-02-28',
             'created': '2026-02-15', 'progress': 100, 'dependencies': []},

            # ─── TO DO ────────────────────────────────────────────────────
            {'id': uid(), 'title': 'Pitch Link Clearance Check', 'desc': 'Verifying bearing clearances in the main rotor pitch control links.',
             'assignee': 'Mustafa', 'priority': 'Medium', 'tags': ['GOKBEY'], 'status': 'todo',
             'estHours': 8, 'deadline': '2026-03-28', 'created': '2026-03-14', 'progress': 0, 'dependencies': [],
             'subtasks': [
                 {'title': 'Disassemble linkage', 'done': False},
                 {'title': 'Measure tolerances', 'done': False},
             ]},
            {'id': uid(), 'title': 'ATAK Pylon Aero Fairing', 'desc': 'Design review of the aerodynamic fairing for the wing-mounted weapon pylons.',
             'assignee': 'Onur', 'priority': 'Low', 'tags': ['ATAK'], 'status': 'todo',
             'estHours': 12, 'deadline': '2026-04-05', 'created': '2026-03-15', 'progress': 0, 'dependencies': []},
            {'id': uid(), 'title': 'Transmission Oil Cooling', 'desc': 'Efficiency test for the main gearbox oil cooling system in hot-day scenarios.',
             'assignee': 'Unassigned', 'priority': 'High', 'tags': ['ONTON'], 'status': 'todo',
             'estHours': 20, 'deadline': '2026-04-10', 'created': '2026-03-15', 'progress': 0, 'dependencies': []},
            {'id': uid(), 'title': 'EM Radiated Emissions', 'desc': 'Spectrum analysis for electromagnetically radiating components in the fuselage.',
             'assignee': 'Unassigned', 'priority': 'Medium', 'tags': ['INFRA'], 'status': 'todo',
             'estHours': 16, 'deadline': '2026-04-12', 'created': '2026-03-16', 'progress': 0, 'dependencies': []},
            {'id': uid(), 'title': 'Pilot Flight Manual Update', 'desc': 'Updating the handling qualities section of the preliminary flight manual.',
             'assignee': 'Fatih', 'priority': 'Low', 'tags': ['ATAK', 'GOKBEY'], 'status': 'todo',
             'estHours': 10, 'deadline': '2026-04-15', 'created': '2026-03-16', 'progress': 0, 'dependencies': []},
            {'id': uid(), 'title': 'Swashplate Load Survey', 'desc': 'Measuring control rod loads during lateral cyclic maneuvers.',
             'assignee': 'Unassigned', 'priority': 'Low', 'tags': ['KIHA'], 'status': 'todo',
             'estHours': 12, 'deadline': '2026-04-02', 'created': '2026-03-16', 'progress': 0, 'dependencies': []},
        ]

        for td in tasks_data:
            subtasks_data = td.pop('subtasks', [])
            comments_data = td.pop('comments', [])
            task = Task(**td)
            for i, s in enumerate(subtasks_data):
                task.subtasks.append(Subtask(id=uid(), title=s['title'], done=s.get('done', False),
                                            ganttStart=s.get('ganttStart'), deadline=s.get('deadline'), sort_order=i))
            for c in comments_data:
                task.comments.append(Comment(id=uid(), author=c['author'], text=c['text'], ts=c['ts']))
            db.session.add(task)

        db.session.commit()
        print(f"Seeded {len(tasks_data)} tasks successfully.")


if __name__ == '__main__':
    seed()
