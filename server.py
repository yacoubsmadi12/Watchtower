import os
import logging
import socket
import threading
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
from datetime import datetime
from uuid import uuid4

# Configuration
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASS = os.getenv('MYSQL_PASS', 'password')
MYSQL_DB = os.getenv('MYSQL_DB', 'zainjo_watchtower')
SYSLOG_PORT = int(os.getenv('SYSLOG_PORT', 1514))
API_TOKEN = os.getenv('API_TOKEN', 'secret-token')

# Path to static files
STATIC_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist', 'public')

# Setup Flask with static file serving
app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path='')
CORS(app)

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ZainJoWatchtower")

# In-memory storage for when MySQL is not available
log_sources = {}
log_entries = {}
report_templates = {}
report_rules = {}
rule_employees = {}

# Initialize default log sources
def init_default_sources():
    global log_sources
    defaults = [
        {"name": "NCE FAN HQ", "ipAddress": "10.119.19.95", "status": "inactive", "description": "NCE FAN HQ System"},
        {"name": "NCE IP +T", "ipAddress": "10.119.19.80", "status": "inactive", "description": "NCE IP +T System"},
        {"name": "NCE HOME_INSIGHT", "ipAddress": "10.119.21.6", "status": "inactive", "description": "NCE HOME_INSIGHT System"},
        {"name": "U2020", "ipAddress": "10.119.10.4", "status": "inactive", "description": "U2020 System"},
        {"name": "PRS", "ipAddress": "10.119.10.104", "status": "inactive", "description": "PRS System"},
    ]
    for source in defaults:
        source_id = str(uuid4())
        log_sources[source_id] = {"id": source_id, **source}

init_default_sources()

# Database Connection (optional - falls back to in-memory)
def get_db_connection():
    try:
        return mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASS,
            database=MYSQL_DB
        )
    except Exception as e:
        logger.warning(f"MySQL not available, using in-memory storage: {e}")
        return None

# --- CSV Parser ---
def parse_csv_field(value):
    if not value:
        return ''
    result = value.strip()
    if result.startswith('"') and result.endswith('"'):
        result = result[1:-1]
    result = result.replace('""', '"')
    return result.lstrip('\t').strip()

def parse_huawei_csv_line(line):
    if not line.strip() or line.startswith('Operation,') or line.startswith('\ufeffOperation,'):
        return None
    
    parts = []
    current = ''
    in_quotes = False
    
    for i, char in enumerate(line):
        if char == '"':
            if in_quotes and i + 1 < len(line) and line[i + 1] == '"':
                current += '"'
                continue
            in_quotes = not in_quotes
        elif char == ',' and not in_quotes:
            parts.append(current)
            current = ''
        else:
            current += char
    parts.append(current)
    
    if len(parts) < 8:
        return None
    
    return {
        'operation': parse_csv_field(parts[0]),
        'level': parse_csv_field(parts[1]),
        'operator': parse_csv_field(parts[2]),
        'time': parse_csv_field(parts[3]),
        'source': parse_csv_field(parts[4]),
        'terminalIp': parse_csv_field(parts[5]),
        'operationObject': parse_csv_field(parts[6]),
        'result': parse_csv_field(parts[7]),
        'details': parse_csv_field(','.join(parts[8:])) if len(parts) > 8 else ''
    }

def determine_severity(level, result):
    lower_level = level.lower()
    lower_result = result.lower()
    
    if 'failed' in lower_result or 'deny' in lower_result:
        if 'major' in lower_level or 'critical' in lower_level:
            return 'critical'
        if 'warning' in lower_level:
            return 'error'
        return 'warning'
    
    if 'critical' in lower_level or 'risk' in lower_level:
        return 'critical'
    if 'major' in lower_level:
        return 'error'
    if 'warning' in lower_level:
        return 'warning'
    return 'info'

def generate_analysis_message(parsed):
    if not parsed:
        return 'Unknown log entry'
    
    operation = parsed.get('operation', '')
    operator = parsed.get('operator', 'system')
    result = parsed.get('result', '')
    operation_object = parsed.get('operationObject', '')
    terminal_ip = parsed.get('terminalIp', '')
    
    if 'failed' in result.lower():
        return f"[FAILED] {operation} by {operator} on {operation_object} from {terminal_ip}"
    if 'deny' in result.lower():
        return f"[DENIED] {operation} by {operator} - device does not exist: {operation_object}"
    return f"{operation} by {operator} on {operation_object} - {result}"

# --- Rules Engine & Parser ---
def parse_log(raw_data):
    return {"raw": raw_data, "source": "unknown", "timestamp": datetime.now().isoformat()}

def evaluate_rules(event):
    return []

def save_event(event):
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            sql = "INSERT INTO events (timestamp, source, raw, parsed) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (event['timestamp'], event['source'], event['raw'], json.dumps(event)))
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            logger.error(f"DB Error: {e}")
    else:
        logger.info(f"Event stored in memory: {event}")

# --- Syslog Listener ---
def syslog_listener():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(('0.0.0.0', SYSLOG_PORT))
    logger.info(f"Syslog UDP listener started on port {SYSLOG_PORT}")
    
    while True:
        data, addr = sock.recvfrom(4096)
        raw_msg = data.decode('utf-8').strip()
        logger.info(f"Received Syslog from {addr}: {raw_msg}")
        
        event = parse_log(raw_msg)
        event['source'] = addr[0]
        
        save_event(event)

# --- API Routes ---
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "operational"}), 200

@app.route('/api/sources', methods=['GET'])
def get_sources():
    return jsonify(list(log_sources.values()))

@app.route('/api/sources', methods=['POST'])
def create_source():
    data = request.json
    source_id = str(uuid4())
    source = {
        "id": source_id,
        "name": data.get("name", ""),
        "ipAddress": data.get("ipAddress", ""),
        "status": data.get("status", "inactive"),
        "description": data.get("description", "")
    }
    log_sources[source_id] = source
    return jsonify(source), 201

@app.route('/api/sources/<source_id>', methods=['PUT'])
def update_source(source_id):
    if source_id not in log_sources:
        return jsonify({"error": "Not found"}), 404
    data = request.json
    log_sources[source_id].update(data)
    return jsonify(log_sources[source_id])

@app.route('/api/sources/<source_id>', methods=['DELETE'])
def delete_source(source_id):
    if source_id not in log_sources:
        return jsonify({"error": "Not found"}), 404
    del log_sources[source_id]
    return '', 204

@app.route('/api/logs', methods=['GET'])
def get_logs():
    source_id = request.args.get('sourceId')
    if source_id:
        filtered = [e for e in log_entries.values() if e.get('sourceId') == source_id]
        return jsonify(sorted(filtered, key=lambda x: x.get('timestamp', ''), reverse=True))
    return jsonify(sorted(log_entries.values(), key=lambda x: x.get('timestamp', ''), reverse=True))

@app.route('/api/logs', methods=['POST'])
def create_log():
    data = request.json
    entry_id = str(uuid4())
    entry = {
        "id": entry_id,
        "sourceId": data.get("sourceId", ""),
        "timestamp": datetime.now().isoformat(),
        "severity": data.get("severity", "info"),
        "message": data.get("message", ""),
        "analysisStatus": data.get("analysisStatus", "pending"),
        "rawData": data.get("rawData", "")
    }
    log_entries[entry_id] = entry
    
    # Update source status to active
    source_id = data.get("sourceId")
    if source_id and source_id in log_sources:
        log_sources[source_id]["status"] = "active"
    
    return jsonify(entry), 201

@app.route('/api/logs/<entry_id>', methods=['PUT'])
def update_log(entry_id):
    if entry_id not in log_entries:
        return jsonify({"error": "Not found"}), 404
    data = request.json
    log_entries[entry_id].update(data)
    return jsonify(log_entries[entry_id])

@app.route('/api/logs/upload-csv', methods=['POST'])
def upload_csv():
    data = request.json
    source_id = data.get('sourceId')
    csv_content = data.get('csvContent')
    
    if not source_id or not csv_content:
        return jsonify({"error": "sourceId and csvContent are required"}), 400
    
    if source_id not in log_sources:
        return jsonify({"error": "Log source not found"}), 404
    
    lines = csv_content.split('\n')
    success_count = 0
    failed_count = 0
    skipped_lines = 0
    errors = []
    
    for i, line in enumerate(lines):
        if not line.strip():
            continue
        
        parsed = parse_huawei_csv_line(line)
        if not parsed:
            skipped_lines += 1
            if i > 0:
                errors.append(f"Line {i + 1}: Could not parse CSV format")
            continue
        
        try:
            severity = determine_severity(parsed['level'], parsed['result'])
            message = generate_analysis_message(parsed)
            analysis_status = 'completed' if 'successful' in parsed['result'].lower() else 'pending'
            
            entry_id = str(uuid4())
            entry = {
                "id": entry_id,
                "sourceId": source_id,
                "timestamp": datetime.now().isoformat(),
                "severity": severity,
                "message": message,
                "analysisStatus": analysis_status,
                "rawData": json.dumps(parsed)
            }
            log_entries[entry_id] = entry
            success_count += 1
        except Exception as e:
            errors.append(f"Line {i + 1}: {str(e)}")
            failed_count += 1
    
    # Update source status
    if success_count > 0:
        log_sources[source_id]["status"] = "active"
    
    return jsonify({
        "success": True,
        "summary": {
            "total": len(lines),
            "processed": success_count,
            "failed": failed_count,
            "skipped": skipped_lines
        },
        "sourceStatus": log_sources[source_id]["status"],
        "errors": errors[:20] if errors else None,
        "message": f"Successfully processed {success_count} log entries"
    }), 201

@app.route('/api/templates', methods=['GET'])
def get_templates():
    return jsonify(sorted(report_templates.values(), key=lambda x: x.get('createdAt', ''), reverse=True))

@app.route('/api/templates/<template_id>', methods=['GET'])
def get_template(template_id):
    if template_id not in report_templates:
        return jsonify({"error": "Not found"}), 404
    return jsonify(report_templates[template_id])

@app.route('/api/templates', methods=['POST'])
def create_template():
    data = request.json
    template_id = str(uuid4())
    template = {
        "id": template_id,
        "name": data.get("name", ""),
        "adminName": data.get("adminName", ""),
        "managerEmail": data.get("managerEmail", ""),
        "schedule": data.get("schedule", "weekly"),
        "createdAt": datetime.now().isoformat()
    }
    report_templates[template_id] = template
    return jsonify(template), 201

@app.route('/api/templates/<template_id>', methods=['PUT'])
def update_template(template_id):
    if template_id not in report_templates:
        return jsonify({"error": "Not found"}), 404
    data = request.json
    report_templates[template_id].update(data)
    return jsonify(report_templates[template_id])

@app.route('/api/templates/<template_id>', methods=['DELETE'])
def delete_template(template_id):
    if template_id not in report_templates:
        return jsonify({"error": "Not found"}), 404
    # Delete associated rules and employees
    rules_to_delete = [r for r in report_rules.values() if r.get('templateId') == template_id]
    for rule in rules_to_delete:
        rule_id = rule['id']
        # Delete employees for this rule
        emps_to_delete = [e['id'] for e in rule_employees.values() if e.get('ruleId') == rule_id]
        for emp_id in emps_to_delete:
            del rule_employees[emp_id]
        del report_rules[rule_id]
    del report_templates[template_id]
    return '', 204

@app.route('/api/rules', methods=['GET'])
def get_rules():
    template_id = request.args.get('templateId')
    if template_id:
        filtered = [r for r in report_rules.values() if r.get('templateId') == template_id]
        return jsonify(sorted(filtered, key=lambda x: x.get('createdAt', ''), reverse=True))
    return jsonify(sorted(report_rules.values(), key=lambda x: x.get('createdAt', ''), reverse=True))

@app.route('/api/rules/<rule_id>', methods=['GET'])
def get_rule(rule_id):
    if rule_id not in report_rules:
        return jsonify({"error": "Not found"}), 404
    return jsonify(report_rules[rule_id])

@app.route('/api/rules', methods=['POST'])
def create_rule():
    data = request.json
    rule_id = str(uuid4())
    rule = {
        "id": rule_id,
        "templateId": data.get("templateId", ""),
        "ruleName": data.get("ruleName", ""),
        "jobDescription": data.get("jobDescription", ""),
        "createdAt": datetime.now().isoformat()
    }
    report_rules[rule_id] = rule
    return jsonify(rule), 201

@app.route('/api/rules/<rule_id>', methods=['PUT'])
def update_rule(rule_id):
    if rule_id not in report_rules:
        return jsonify({"error": "Not found"}), 404
    data = request.json
    report_rules[rule_id].update(data)
    return jsonify(report_rules[rule_id])

@app.route('/api/rules/<rule_id>', methods=['DELETE'])
def delete_rule(rule_id):
    if rule_id not in report_rules:
        return jsonify({"error": "Not found"}), 404
    # Delete associated employees
    emps_to_delete = [e['id'] for e in rule_employees.values() if e.get('ruleId') == rule_id]
    for emp_id in emps_to_delete:
        del rule_employees[emp_id]
    del report_rules[rule_id]
    return '', 204

@app.route('/api/employees', methods=['GET'])
def get_employees():
    rule_id = request.args.get('ruleId')
    if rule_id:
        filtered = [e for e in rule_employees.values() if e.get('ruleId') == rule_id]
        return jsonify(filtered)
    return jsonify(list(rule_employees.values()))

@app.route('/api/employees', methods=['POST'])
def create_employee():
    data = request.json
    emp_id = str(uuid4())
    employee = {
        "id": emp_id,
        "ruleId": data.get("ruleId", ""),
        "username": data.get("username", ""),
        "permissions": data.get("permissions", ""),
        "createdAt": datetime.now().isoformat()
    }
    rule_employees[emp_id] = employee
    return jsonify(employee), 201

@app.route('/api/employees/bulk', methods=['POST'])
def create_employees_bulk():
    data = request.json
    rule_id = data.get('ruleId')
    employees = data.get('employees', [])
    
    if not rule_id or not employees:
        return jsonify({"error": "ruleId and employees are required"}), 400
    
    created = []
    for emp in employees:
        emp_id = str(uuid4())
        employee = {
            "id": emp_id,
            "ruleId": rule_id,
            "username": emp.get("username", "").strip(),
            "permissions": emp.get("permissions", ""),
            "createdAt": datetime.now().isoformat()
        }
        rule_employees[emp_id] = employee
        created.append(employee)
    
    return jsonify(created), 201

@app.route('/api/employees/<emp_id>', methods=['DELETE'])
def delete_employee(emp_id):
    if emp_id not in rule_employees:
        return jsonify({"error": "Not found"}), 404
    del rule_employees[emp_id]
    return '', 204

@app.route('/api/reports/download', methods=['GET'])
def download_report():
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    source_id = request.args.get('sourceId')
    template_id = request.args.get('templateId')
    
    logs = list(log_entries.values())
    
    if source_id:
        logs = [l for l in logs if l.get('sourceId') == source_id]
    
    # Get source info
    source_map = {s['id']: s for s in log_sources.values()}
    
    template_data = None
    rules_data = []
    
    if template_id and template_id in report_templates:
        template_data = report_templates[template_id]
        rules = [r for r in report_rules.values() if r.get('templateId') == template_id]
        for rule in rules:
            emps = [e for e in rule_employees.values() if e.get('ruleId') == rule['id']]
            rules_data.append({**rule, 'employees': emps})
    
    report = {
        "generatedAt": datetime.now().isoformat(),
        "filters": {"startDate": start_date, "endDate": end_date, "sourceId": source_id},
        "template": template_data,
        "rules": rules_data,
        "summary": {
            "totalLogs": len(logs),
            "bySeverity": {
                "critical": len([l for l in logs if l.get('severity') == 'critical']),
                "error": len([l for l in logs if l.get('severity') == 'error']),
                "warning": len([l for l in logs if l.get('severity') == 'warning']),
                "info": len([l for l in logs if l.get('severity') == 'info']),
            },
            "byAnalysisStatus": {
                "pending": len([l for l in logs if l.get('analysisStatus') == 'pending']),
                "inProgress": len([l for l in logs if l.get('analysisStatus') == 'in-progress']),
                "completed": len([l for l in logs if l.get('analysisStatus') == 'completed']),
            },
        },
        "logs": [{
            **log,
            "sourceName": source_map.get(log.get('sourceId'), {}).get('name', 'Unknown'),
            "sourceIp": source_map.get(log.get('sourceId'), {}).get('ipAddress', 'Unknown'),
        } for log in logs]
    }
    
    response = jsonify(report)
    response.headers['Content-Disposition'] = f'attachment; filename=log-report-{int(datetime.now().timestamp())}.json'
    return response

# --- Serve Frontend ---
@app.route('/')
def serve_index():
    return send_from_directory(STATIC_FOLDER, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # Try to serve the file directly
    file_path = os.path.join(STATIC_FOLDER, path)
    if os.path.isfile(file_path):
        return send_from_directory(STATIC_FOLDER, path)
    # For SPA routing, serve index.html for non-file routes
    return send_from_directory(STATIC_FOLDER, 'index.html')

if __name__ == '__main__':
    # Start Syslog Thread
    t = threading.Thread(target=syslog_listener)
    t.daemon = True
    t.start()
    
    logger.info(f"Static files served from: {STATIC_FOLDER}")
    
    # Start Flask
    app.run(host='0.0.0.0', port=5000)
