import { useState, useEffect, useCallback } from 'react';
import { Event, Alert, MONITORED_SYSTEMS } from '../lib/mock-data';
import { LogParser } from '../lib/parser';
import { RulesEngine } from '../lib/rules-engine';

// Mock generators
const MOCK_USERS = ['admin', 'ops_user', 'unknown', 'audit_view'];
const MOCK_OPS = ['LOGIN', 'LOGOUT', 'DELETE_LOGS', 'MODIFY_CONFIG', 'VIEW_DASHBOARD', 'ROOT_LOGIN', 'DB_QUERY'];

function generateRandomLog(): string {
  const type = Math.random();
  // Pick a random registered system to be the source
  const targetSystem = MONITORED_SYSTEMS[Math.floor(Math.random() * MONITORED_SYSTEMS.length)];
  const src = targetSystem.ip;
  const srcName = targetSystem.name;
  
  const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
  const op = MOCK_OPS[Math.floor(Math.random() * MOCK_OPS.length)];
  
  if (type < 0.3) {
    // CEF
    return `CEF:0|Huawei|NMS|V1.0|100|Operation Log|5|src=${src} user=${user} operation=${op} msg=Performed action successfully`;
  } else if (type < 0.5) {
    // KV
    return `timestamp="${new Date().toISOString()}" src="${src}" user="${user}" operation="${op}" status="success"`;
  } else if (type < 0.75) {
    // Huawei CSV
    const dateStr = new Date().toLocaleString('en-GB'); // DD/MM/YYYY ...
    const level = Math.random() > 0.5 ? 'Warning' : (Math.random() > 0.5 ? 'Minor' : 'Risk');
    // Operation,Level,Operator,Time,Source,Terminal IP Address,Operation Object,Result,Details
    return `${op},${level},,"   ${dateStr}",${srcName},${src},${op}_Obj,Successful,"Function: [Configuration] ${op} executed successfully."`;
  } else {
    // Syslog
    return `Nov 27 10:00:00 ${src} systemd[1]: Started Session ${Math.floor(Math.random() * 1000)} of user ${user}.`;
  }
}

export function useWatchtower() {
  const [events, setEvents] = useState<Event[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  const ingestLog = useCallback((raw: string) => {
    const parsed = LogParser.parse(raw);
    const newEvent: Event = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      source: parsed.src || parsed.source || 'unknown',
      raw,
      parsed,
      severity: parsed.severity || 'info'
    };

    // Run Rules
    const newAlerts = RulesEngine.evaluate(newEvent);

    setEvents(prev => [newEvent, ...prev].slice(0, 200)); // Keep last 200
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 200));
    }
  }, []);

  // Simulation Effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.3) { // 70% chance to get a log
        ingestLog(generateRandomLog());
      }
    }, 2000); // Every 2 seconds

    return () => clearInterval(interval);
  }, [ingestLog]);

  return {
    events,
    alerts,
    isConnected,
    ingestLog
  };
}
