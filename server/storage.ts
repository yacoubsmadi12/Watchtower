import { type User, type InsertUser, type LogSource, type InsertLogSource, type LogEntry, type InsertLogEntry } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private logSources: Map<string, LogSource>;
  private logEntries: Map<string, LogEntry>;

  constructor() {
    this.users = new Map();
    this.logSources = new Map();
    this.logEntries = new Map();
    
    this.seedLogSources();
    this.seedLogEntries();
  }

  private seedLogSources() {
    const sources: InsertLogSource[] = [
      { name: "NCE FAN HQ", ipAddress: "10.119.19.95", status: "active", description: "NCE FAN HQ System" },
      { name: "NCE IP +T", ipAddress: "10.119.19.80", status: "active", description: "NCE IP +T System" },
      { name: "NCE HOME_INSIGHT", ipAddress: "10.119.21.6", status: "active", description: "NCE HOME_INSIGHT System" },
      { name: "U2020", ipAddress: "10.119.10.4", status: "active", description: "U2020 System" },
      { name: "PRS", ipAddress: "10.119.10.104", status: "active", description: "PRS System" },
    ];
    
    sources.forEach(source => {
      const id = randomUUID();
      this.logSources.set(id, { 
        ...source, 
        id,
        status: source.status || "active"
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
      status: insertSource.status || "active"
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
      analysisStatus: insertEntry.analysisStatus || "pending"
    };
    this.logEntries.set(id, entry);
    return entry;
  }

  async updateLogEntry(id: string, updates: Partial<InsertLogEntry>): Promise<LogEntry | undefined> {
    const entry = this.logEntries.get(id);
    if (!entry) return undefined;
    
    const updatedEntry = { ...entry, ...updates };
    this.logEntries.set(id, updatedEntry);
    return updatedEntry;
  }
}

export const storage = new MemStorage();
