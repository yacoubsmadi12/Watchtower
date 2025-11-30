import { db } from "./db";
import { 
  users, logSources, logEntries, reportTemplates, reportRules, ruleEmployees,
  type User, type InsertUser,
  type LogSource, type InsertLogSource,
  type LogEntry, type InsertLogEntry,
  type ReportTemplate, type InsertReportTemplate,
  type ReportRule, type InsertReportRule,
  type RuleEmployee, type InsertRuleEmployee
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getAllLogSources(): Promise<LogSource[]> {
    return await db.select().from(logSources);
  }

  async getLogSource(id: string): Promise<LogSource | undefined> {
    const result = await db.select().from(logSources).where(eq(logSources.id, id)).limit(1);
    return result[0];
  }

  async createLogSource(source: InsertLogSource): Promise<LogSource> {
    const result = await db.insert(logSources).values(source).returning();
    return result[0];
  }

  async updateLogSource(id: string, source: Partial<InsertLogSource>): Promise<LogSource | undefined> {
    const result = await db.update(logSources).set(source).where(eq(logSources.id, id)).returning();
    return result[0];
  }

  async deleteLogSource(id: string): Promise<boolean> {
    const result = await db.delete(logSources).where(eq(logSources.id, id)).returning();
    return result.length > 0;
  }

  async getAllLogEntries(): Promise<LogEntry[]> {
    return await db.select().from(logEntries).orderBy(desc(logEntries.timestamp));
  }

  async getLogEntriesBySource(sourceId: string): Promise<LogEntry[]> {
    return await db.select().from(logEntries).where(eq(logEntries.sourceId, sourceId)).orderBy(desc(logEntries.timestamp));
  }

  async createLogEntry(entry: InsertLogEntry): Promise<LogEntry> {
    const result = await db.insert(logEntries).values(entry).returning();
    const created = result[0];
    
    const source = await this.getLogSource(entry.sourceId);
    if (source && source.status !== "active") {
      await this.updateLogSource(entry.sourceId, { status: "active" });
    }
    
    return created;
  }

  async updateLogEntry(id: string, entry: Partial<InsertLogEntry>): Promise<LogEntry | undefined> {
    const result = await db.update(logEntries).set(entry).where(eq(logEntries.id, id)).returning();
    return result[0];
  }

  async getAllReportTemplates(): Promise<ReportTemplate[]> {
    return await db.select().from(reportTemplates).orderBy(desc(reportTemplates.createdAt));
  }

  async getReportTemplate(id: string): Promise<ReportTemplate | undefined> {
    const result = await db.select().from(reportTemplates).where(eq(reportTemplates.id, id)).limit(1);
    return result[0];
  }

  async createReportTemplate(template: InsertReportTemplate): Promise<ReportTemplate> {
    const result = await db.insert(reportTemplates).values(template).returning();
    return result[0];
  }

  async updateReportTemplate(id: string, template: Partial<InsertReportTemplate>): Promise<ReportTemplate | undefined> {
    const result = await db.update(reportTemplates).set(template).where(eq(reportTemplates.id, id)).returning();
    return result[0];
  }

  async deleteReportTemplate(id: string): Promise<boolean> {
    const rules = await this.getReportRulesByTemplate(id);
    for (const rule of rules) {
      await this.deleteRuleEmployeesByRule(rule.id);
      await this.deleteReportRule(rule.id);
    }
    const result = await db.delete(reportTemplates).where(eq(reportTemplates.id, id)).returning();
    return result.length > 0;
  }

  async getAllReportRules(): Promise<ReportRule[]> {
    return await db.select().from(reportRules).orderBy(desc(reportRules.createdAt));
  }

  async getReportRulesByTemplate(templateId: string): Promise<ReportRule[]> {
    return await db.select().from(reportRules).where(eq(reportRules.templateId, templateId)).orderBy(desc(reportRules.createdAt));
  }

  async getReportRule(id: string): Promise<ReportRule | undefined> {
    const result = await db.select().from(reportRules).where(eq(reportRules.id, id)).limit(1);
    return result[0];
  }

  async createReportRule(rule: InsertReportRule): Promise<ReportRule> {
    const result = await db.insert(reportRules).values(rule).returning();
    return result[0];
  }

  async updateReportRule(id: string, rule: Partial<InsertReportRule>): Promise<ReportRule | undefined> {
    const result = await db.update(reportRules).set(rule).where(eq(reportRules.id, id)).returning();
    return result[0];
  }

  async deleteReportRule(id: string): Promise<boolean> {
    await this.deleteRuleEmployeesByRule(id);
    const result = await db.delete(reportRules).where(eq(reportRules.id, id)).returning();
    return result.length > 0;
  }

  async getAllRuleEmployees(): Promise<RuleEmployee[]> {
    return await db.select().from(ruleEmployees);
  }

  async getRuleEmployeesByRule(ruleId: string): Promise<RuleEmployee[]> {
    return await db.select().from(ruleEmployees).where(eq(ruleEmployees.ruleId, ruleId));
  }

  async createRuleEmployee(employee: InsertRuleEmployee): Promise<RuleEmployee> {
    const result = await db.insert(ruleEmployees).values(employee).returning();
    return result[0];
  }

  async createRuleEmployeesBulk(employees: InsertRuleEmployee[]): Promise<RuleEmployee[]> {
    if (employees.length === 0) return [];
    const result = await db.insert(ruleEmployees).values(employees).returning();
    return result;
  }

  async deleteRuleEmployee(id: string): Promise<boolean> {
    const result = await db.delete(ruleEmployees).where(eq(ruleEmployees.id, id)).returning();
    return result.length > 0;
  }

  async deleteRuleEmployeesByRule(ruleId: string): Promise<boolean> {
    const result = await db.delete(ruleEmployees).where(eq(ruleEmployees.ruleId, ruleId)).returning();
    return true;
  }
}
