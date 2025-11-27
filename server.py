import os
import logging
import socket
import threading
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from datetime import datetime

# Configuration
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASS = os.getenv('MYSQL_PASS', 'password')
MYSQL_DB = os.getenv('MYSQL_DB', 'zainjo_watchtower')
SYSLOG_PORT = int(os.getenv('SYSLOG_PORT', 1514))
API_TOKEN = os.getenv('API_TOKEN', 'secret-token')

# Setup Flask
app = Flask(__name__)
CORS(app)

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ZainJoWatchtower")

# Database Connection
def get_db_connection():
    return mysql.connector.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASS,
        database=MYSQL_DB
    )

# --- Rules Engine & Parser (Simplified for this file) ---
def parse_log(raw_data):
    # Placeholder for the complex parser logic implemented in the frontend prototype
    return {"raw": raw_data, "source": "unknown", "timestamp": datetime.now().isoformat()}

def evaluate_rules(event):
    # Placeholder for rules engine
    return []

def save_event(event):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "INSERT INTO events (timestamp, source, raw, parsed) VALUES (%s, %s, %s, %s)"
        cursor.execute(sql, (event['timestamp'], event['source'], event['raw'], json.dumps(event)))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        logger.error(f"DB Error: {e}")

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
        # evaluate_rules(event) -> save alerts

# --- API Routes ---
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "operational", "db": "connected"}), 200

@app.route('/api/logs', methods=['POST'])
def ingest_logs():
    token = request.headers.get('Authorization')
    if token != f"Bearer {API_TOKEN}":
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    # Process log...
    return jsonify({"status": "received"}), 200

@app.route('/api/events', methods=['GET'])
def get_events():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM events ORDER BY timestamp DESC LIMIT 200")
    events = cursor.fetchall()
    conn.close()
    return jsonify(events)

if __name__ == '__main__':
    # Start Syslog Thread
    t = threading.Thread(target=syslog_listener)
    t.daemon = True
    t.start()
    
    # Start Flask
    app.run(host='0.0.0.0', port=5000)
