import { 
  type User, type InsertUser, 
  type LogSource, type InsertLogSource, 
  type LogEntry, type InsertLogEntry,
  type ReportTemplate, type InsertReportTemplate,
  type ReportRule, type InsertReportRule,
  type RuleEmployee, type InsertRuleEmployee
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllLogSources(): Promise<LogSource[]>;
  getLogSource(id: string): Promise<LogSource | undefined>;
  createLogSource(source: InsertLogSource): Promise<LogSource>;
  updateLogSource(id: string, source: Partial<InsertLogSource>): Promise<LogSource | undefined>;
  deleteLogSource(id: string): Promise<boolean>;
  
  getAllLogEntries(): Promise<LogEntry[]>;
  getLogEntriesBySource(sourceId: string): Promise<LogEntry[]>;
  createLogEntry(entry: InsertLogEntry): Promise<LogEntry>;
  updateLogEntry(id: string, entry: Partial<InsertLogEntry>): Promise<LogEntry | undefined>;

  getAllReportTemplates(): Promise<ReportTemplate[]>;
  getReportTemplate(id: string): Promise<ReportTemplate | undefined>;
  createReportTemplate(template: InsertReportTemplate): Promise<ReportTemplate>;
  updateReportTemplate(id: string, template: Partial<InsertReportTemplate>): Promise<ReportTemplate | undefined>;
  deleteReportTemplate(id: string): Promise<boolean>;

  getAllReportRules(): Promise<ReportRule[]>;
  getReportRulesByTemplate(templateId: string): Promise<ReportRule[]>;
  getReportRule(id: string): Promise<ReportRule | undefined>;
  createReportRule(rule: InsertReportRule): Promise<ReportRule>;
  updateReportRule(id: string, rule: Partial<InsertReportRule>): Promise<ReportRule | undefined>;
  deleteReportRule(id: string): Promise<boolean>;

  getAllRuleEmployees(): Promise<RuleEmployee[]>;
  getRuleEmployeesByRule(ruleId: string): Promise<RuleEmployee[]>;
  createRuleEmployee(employee: InsertRuleEmployee): Promise<RuleEmployee>;
  createRuleEmployeesBulk(employees: InsertRuleEmployee[]): Promise<RuleEmployee[]>;
  deleteRuleEmployee(id: string): Promise<boolean>;
  deleteRuleEmployeesByRule(ruleId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private logSources: Map<string, LogSource>;
  private logEntries: Map<string, LogEntry>;
  private reportTemplates: Map<string, ReportTemplate>;
  private reportRules: Map<string, ReportRule>;
  private ruleEmployees: Map<string, RuleEmployee>;

  constructor() {
    this.users = new Map();
    this.logSources = new Map();
    this.logEntries = new Map();
    this.reportTemplates = new Map();
    this.reportRules = new Map();
    this.ruleEmployees = new Map();
    
    this.seedLogSources();
  }

  private seedLogSources() {
    const sources: InsertLogSource[] = [
      { name: "NCE FAN HQ", ipAddress: "10.119.19.95", status: "inactive", description: "NCE FAN HQ System" },
      { name: "NCE IP +T", ipAddress: "10.119.19.80", status: "inactive", description: "NCE IP +T System" },
      { name: "NCE HOME_INSIGHT", ipAddress: "10.119.21.6", status: "inactive", description: "NCE HOME_INSIGHT System" },
      { name: "U2020", ipAddress: "10.119.10.4", status: "inactive", description: "U2020 System" },
      { name: "PRS", ipAddress: "10.119.10.104", status: "inactive", description: "PRS System" },
    ];
    
    sources.forEach(source => {
      const id = randomUUID();
      this.logSources.set(id, { 
        ...source, 
        id,
        status: source.status || "active",
        description: source.description || null
      });
    });
  }

  private seedLogEntries() {
    const sourceIds = Array.from(this.logSources.keys());
    if (sourceIds.length === 0) return;

    const sampleLogs: Omit<InsertLogEntry, 'sourceId'>[] = [
      {
        severity: "info",
        message: "User admin logged in successfully",
        analysisStatus: "completed",
        rawData: "CEF:0|Huawei|NMS|V1.0|100|Login|5|user=admin action=LOGIN status=success",
      },
      {
        severity: "warning",
        message: "Failed login attempt detected",
        analysisStatus: "in-progress",
        rawData: "CEF:0|Huawei|NMS|V1.0|101|Login Failed|7|user=unknown action=LOGIN status=failed",
      },
      {
        severity: "critical",
        message: "Unauthorized database access attempt",
        analysisStatus: "pending",
        rawData: "CEF:0|Huawei|NMS|V1.0|500|Security Alert|10|user=root action=DB_ACCESS status=blocked",
      },
      {
        severity: "error",
        message: "Configuration change detected without approval",
        analysisStatus: "in-progress",
        rawData: "Operation,Risk,ops_user,Config Change,,,Successful,Unauthorized configuration modification",
      },
      {
        severity: "info",
        message: "System health check completed successfully",
        analysisStatus: "completed",
        rawData: "timestamp=\"2025-11-30T06:00:00Z\" event=HEALTH_CHECK status=OK",
      },
    ];

    sampleLogs.forEach((log, index) => {
      const id = randomUUID();
      const sourceId = sourceIds[index % sourceIds.length];
      const timestamp = new Date(Date.now() - (index * 3600000));
      this.logEntries.set(id, {
        ...log,
        id,
        sourceId,
        timestamp,
        analysisStatus: log.analysisStatus || "pending",
        rawData: log.rawData || null
      });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllLogSources(): Promise<LogSource[]> {
    return Array.from(this.logSources.values());
  }

  async getLogSource(id: string): Promise<LogSource | undefined> {
    return this.logSources.get(id);
  }

  async createLogSource(insertSource: InsertLogSource): Promise<LogSource> {
    const id = randomUUID();
    const source: LogSource = { 
      ...insertSource,
      id,
      status: insertSource.status || "inactive",
      description: insertSource.description || null
    };
    this.logSources.set(id, source);
    return source;
  }

  async updateLogSource(id: string, updates: Partial<InsertLogSource>): Promise<LogSource | undefined> {
    const source = this.logSources.get(id);
    if (!source) return undefined;
    
    const updatedSource = { ...source, ...updates };
    this.logSources.set(id, updatedSource);
    return updatedSource;
  }

  async deleteLogSource(id: string): Promise<boolean> {
    return this.logSources.delete(id);
  }

  async getAllLogEntries(): Promise<LogEntry[]> {
    return Array.from(this.logEntries.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getLogEntriesBySource(sourceId: string): Promise<LogEntry[]> {
    return Array.from(this.logEntries.values())
      .filter(entry => entry.sourceId === sourceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createLogEntry(insertEntry: InsertLogEntry): Promise<LogEntry> {
    const id = randomUUID();
    const entry: LogEntry = { 
      ...insertEntry, 
      id, 
      timestamp: new Date(),
      analysisStatus: insertEntry.analysisStatus || "pending",
      rawData: insertEntry.rawData || null
    };
    this.logEntries.set(id, entry);
    
    const source = this.logSources.get(insertEntry.sourceId);
    if (source && source.status !== "active") {
      this.logSources.set(insertEntry.sourceId, { ...source, status: "active" });
    }
    
    return entry;
  }

  async updateLogEntry(id: string, updates: Partial<InsertLogEntry>): Promise<LogEntry | undefined> {
    const entry = this.logEntries.get(id);
    if (!entry) return undefined;
    
    const updatedEntry = { ...entry, ...updates };
    this.logEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async getAllReportTemplates(): Promise<ReportTemplate[]> {
    return Array.from(this.reportTemplates.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getReportTemplate(id: string): Promise<ReportTemplate | undefined> {
    return this.reportTemplates.get(id);
  }

  async createReportTemplate(insertTemplate: InsertReportTemplate): Promise<ReportTemplate> {
    const id = randomUUID();
    const template: ReportTemplate = { 
      ...insertTemplate,
      id,
      createdAt: new Date(),
      schedule: insertTemplate.schedule || "weekly"
    };
    this.reportTemplates.set(id, template);
    return template;
  }

  async updateReportTemplate(id: string, updates: Partial<InsertReportTemplate>): Promise<ReportTemplate | undefined> {
    const template = this.reportTemplates.get(id);
    if (!template) return undefined;
    
    const updatedTemplate = { ...template, ...updates };
    this.reportTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteReportTemplate(id: string): Promise<boolean> {
    const rules = await this.getReportRulesByTemplate(id);
    for (const rule of rules) {
      await this.deleteRuleEmployeesByRule(rule.id);
      await this.deleteReportRule(rule.id);
    }
    return this.reportTemplates.delete(id);
  }

  async getAllReportRules(): Promise<ReportRule[]> {
    return Array.from(this.reportRules.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getReportRulesByTemplate(templateId: string): Promise<ReportRule[]> {
    return Array.from(this.reportRules.values())
      .filter(rule => rule.templateId === templateId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getReportRule(id: string): Promise<ReportRule | undefined> {
    return this.reportRules.get(id);
  }

  async createReportRule(insertRule: InsertReportRule): Promise<ReportRule> {
    const id = randomUUID();
    const rule: ReportRule = { 
      ...insertRule,
      id,
      createdAt: new Date()
    };
    this.reportRules.set(id, rule);
    return rule;
  }

  async updateReportRule(id: string, updates: Partial<InsertReportRule>): Promise<ReportRule | undefined> {
    const rule = this.reportRules.get(id);
    if (!rule) return undefined;
    
    const updatedRule = { ...rule, ...updates };
    this.reportRules.set(id, updatedRule);
    return updatedRule;
  }

  async deleteReportRule(id: string): Promise<boolean> {
    await this.deleteRuleEmployeesByRule(id);
    return this.reportRules.delete(id);
  }

  async getAllRuleEmployees(): Promise<RuleEmployee[]> {
    return Array.from(this.ruleEmployees.values());
  }

  async getRuleEmployeesByRule(ruleId: string): Promise<RuleEmployee[]> {
    return Array.from(this.ruleEmployees.values())
      .filter(emp => emp.ruleId === ruleId);
  }

  async createRuleEmployee(insertEmployee: InsertRuleEmployee): Promise<RuleEmployee> {
    const id = randomUUID();
    const employee: RuleEmployee = { 
      ...insertEmployee,
      id,
      createdAt: new Date(),
      permissions: insertEmployee.permissions || null
    };
    this.ruleEmployees.set(id, employee);
    return employee;
  }

  async createRuleEmployeesBulk(employees: InsertRuleEmployee[]): Promise<RuleEmployee[]> {
    const results: RuleEmployee[] = [];
    for (const emp of employees) {
      const created = await this.createRuleEmployee(emp);
      results.push(created);
    }
    return results;
  }

  async deleteRuleEmployee(id: string): Promise<boolean> {
    return this.ruleEmployees.delete(id);
  }

  async deleteRuleEmployeesByRule(ruleId: string): Promise<boolean> {
    const employees = await this.getRuleEmployeesByRule(ruleId);
    for (const emp of employees) {
      this.ruleEmployees.delete(emp.id);
    }
    return true;
  }
}

import { DbStorage } from "./db-storage";
import { seedDatabase } from "./seed";

let storageInstance: IStorage | null = null;

async function getStorage(): Promise<IStorage> {
  if (!storageInstance) {
    if (process.env.DATABASE_URL) {
      await seedDatabase();
      storageInstance = new DbStorage();
    } else {
      storageInstance = new MemStorage();
    }
  }
  return storageInstance;
}

export const storage = {
  getUser: async (id: string) => (await getStorage()).getUser(id),
  getUserByUsername: async (username: string) => (await getStorage()).getUserByUsername(username),
  createUser: async (user: InsertUser) => (await getStorage()).createUser(user),
  getAllLogSources: async () => (await getStorage()).getAllLogSources(),
  getLogSource: async (id: string) => (await getStorage()).getLogSource(id),
  createLogSource: async (source: InsertLogSource) => (await getStorage()).createLogSource(source),
  updateLogSource: async (id: string, source: Partial<InsertLogSource>) => (await getStorage()).updateLogSource(id, source),
  deleteLogSource: async (id: string) => (await getStorage()).deleteLogSource(id),
  getAllLogEntries: async () => (await getStorage()).getAllLogEntries(),
  getLogEntriesBySource: async (sourceId: string) => (await getStorage()).getLogEntriesBySource(sourceId),
  createLogEntry: async (entry: InsertLogEntry) => (await getStorage()).createLogEntry(entry),
  updateLogEntry: async (id: string, entry: Partial<InsertLogEntry>) => (await getStorage()).updateLogEntry(id, entry),
  getAllReportTemplates: async () => (await getStorage()).getAllReportTemplates(),
  getReportTemplate: async (id: string) => (await getStorage()).getReportTemplate(id),
  createReportTemplate: async (template: InsertReportTemplate) => (await getStorage()).createReportTemplate(template),
  updateReportTemplate: async (id: string, template: Partial<InsertReportTemplate>) => (await getStorage()).updateReportTemplate(id, template),
  deleteReportTemplate: async (id: string) => (await getStorage()).deleteReportTemplate(id),
  getAllReportRules: async () => (await getStorage()).getAllReportRules(),
  getReportRulesByTemplate: async (templateId: string) => (await getStorage()).getReportRulesByTemplate(templateId),
  getReportRule: async (id: string) => (await getStorage()).getReportRule(id),
  createReportRule: async (rule: InsertReportRule) => (await getStorage()).createReportRule(rule),
  updateReportRule: async (id: string, rule: Partial<InsertReportRule>) => (await getStorage()).updateReportRule(id, rule),
  deleteReportRule: async (id: string) => (await getStorage()).deleteReportRule(id),
  getAllRuleEmployees: async () => (await getStorage()).getAllRuleEmployees(),
  getRuleEmployeesByRule: async (ruleId: string) => (await getStorage()).getRuleEmployeesByRule(ruleId),
  createRuleEmployee: async (employee: InsertRuleEmployee) => (await getStorage()).createRuleEmployee(employee),
  createRuleEmployeesBulk: async (employees: InsertRuleEmployee[]) => (await getStorage()).createRuleEmployeesBulk(employees),
  deleteRuleEmployee: async (id: string) => (await getStorage()).deleteRuleEmployee(id),
  deleteRuleEmployeesByRule: async (ruleId: string) => (await getStorage()).deleteRuleEmployeesByRule(ruleId),
} satisfies IStorage;
