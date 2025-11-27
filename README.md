# ZainJo Watchtower

## Operation Log Monitoring and Analysis Platform

ZainJo Watchtower is a centralized monitoring system designed to ingest, parse, and analyze operation logs from Huawei NMS. It detects security incidents, forbidden operations, and anomalies in real-time.

## 🚀 Project Status: Prototype Mode

This project is currently running in **Mockup/Prototype Mode** on Replit.
The frontend is fully functional and **simulates** the backend logic (Syslog ingestion, Parsing, Rules Engine) within the browser for demonstration purposes.

### 📂 Included Files for Production

While this Replit instance runs the React Frontend, I have generated the reference backend code you requested:

- `server.py`: The Flask backend with Syslog UDP listener and MySQL connection logic.
- `requirements-backend.txt`: The Python dependencies required for the production backend.

## 🛠️ How to Run (Production)

To deploy the full production system on your Ubuntu VM:

1.  **Install Dependencies:**
    ```bash
    pip install -r requirements-backend.txt
    ```

2.  **Configure Environment:**
    Create a `.env` file:
    ```bash
    MYSQL_HOST=localhost
    MYSQL_USER=zainjo
    MYSQL_PASS=secure_password
    MYSQL_DB=zainjo_watchtower
    SYSLOG_PORT=1514
    ```

3.  **Run the Server:**
    ```bash
    python server.py
    ```

4.  **Serve the Frontend:**
    Build this React project (`npm run build`) and serve the `dist/` folder using Nginx or Flask.

## 🖥️ Prototype Features (Live Demo)

-   **Live Log Feed**: Simulates incoming traffic from Huawei NMS (UDP/1514).
-   **Rules Engine**: Automatically detects "FORBIDDEN_OPERATION" and "SENSITIVE_OPERATION" in the browser.
-   **Alerts Panel**: Displays critical security events in real-time.
-   **Visual Dashboard**: Statistics and system status.

## 🔌 Connecting Huawei NMS

In the production version, configure your Huawei NMS to send Syslog to:
-   **IP**: Your VM IP
-   **Port**: 1514
-   **Protocol**: UDP
-   **Format**: CEF or Key-Value

## 🛡️ Rules Engine Logic

The system currently monitors for:
1.  **Role Violations**: Users performing actions not allowed in their role.
2.  **Sensitive Ops**: `ROOT_LOGIN`, `DB_DROP`, `CONFIG_RESET`.
3.  **Keywords**: "Critical", "Fatal", "Error".
