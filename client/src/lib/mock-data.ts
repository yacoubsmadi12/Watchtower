export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  roleId: number;
}

export interface Permission {
  id: number;
  roleId: number;
  operation: string;
  allowed: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ParsedLog {
  [key: string]: any;
}

export interface Event {
  id: string;
  timestamp: string;
  source: string;
  raw: string;
  parsed: ParsedLog;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
}

export interface Alert {
  id: string;
  eventId: string;
  rule: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  details?: string;
}

// Initial Mock Data
export const ROLES: Role[] = [
  { id: 1, name: 'Administrator' },
  { id: 2, name: 'Operator' },
  { id: 3, name: 'Auditor' },
];

export const USERS: User[] = [
  { id: 1, username: 'admin', roleId: 1 },
  { id: 2, username: 'ops_user', roleId: 2 },
  { id: 3, username: 'audit_view', roleId: 3 },
];

export const PERMISSIONS: Permission[] = [
  { id: 1, roleId: 2, operation: 'DELETE_LOGS', allowed: false, severity: 'critical' },
  { id: 2, roleId: 2, operation: 'MODIFY_CONFIG', allowed: false, severity: 'high' },
  { id: 3, roleId: 2, operation: 'VIEW_DASHBOARD', allowed: true, severity: 'low' },
];
