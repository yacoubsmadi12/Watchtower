import { Event, Alert, USERS, PERMISSIONS, ParsedLog } from './mock-data';

export class RulesEngine {
  static evaluate(event: Event): Alert[] {
    const alerts: Alert[] = [];
    const parsed = event.parsed;

    // Rule 1: Role-Based Permission Check
    // Assuming log contains 'user' and 'operation' fields
    if (parsed.user && parsed.operation) {
      const user = USERS.find(u => u.username === parsed.user);
      if (user) {
        const forbidden = PERMISSIONS.find(p => 
          p.roleId === user.roleId && 
          p.operation === parsed.operation && 
          !p.allowed
        );

        if (forbidden) {
          alerts.push({
            id: crypto.randomUUID(),
            eventId: event.id,
            rule: 'FORBIDDEN_OPERATION',
            severity: forbidden.severity,
            createdAt: new Date().toISOString(),
            details: `User ${user.username} attempted forbidden operation: ${parsed.operation}`
          });
        }
      }
    }

    // Rule 2: Sensitive Operations
    const SENSITIVE_OPS = ['ROOT_LOGIN', 'DB_DROP', 'CONFIG_RESET'];
    if (parsed.operation && SENSITIVE_OPS.includes(parsed.operation)) {
      alerts.push({
        id: crypto.randomUUID(),
        eventId: event.id,
        rule: 'SENSITIVE_OPERATION',
        severity: 'high',
        createdAt: new Date().toISOString(),
        details: `Sensitive operation detected: ${parsed.operation}`
      });
    }

    // Rule 3: Keyword Detection (Simple Anomaly)
    if (event.raw.toLowerCase().includes('error') || event.raw.toLowerCase().includes('fail')) {
       // Only alert if it looks severe
       if (event.raw.toLowerCase().includes('critical') || event.raw.toLowerCase().includes('fatal')) {
         alerts.push({
           id: crypto.randomUUID(),
           eventId: event.id,
           rule: 'CRITICAL_KEYWORD',
           severity: 'medium',
           createdAt: new Date().toISOString(),
           details: 'Log contains critical failure keywords'
         });
       }
    }

    return alerts;
  }
}
