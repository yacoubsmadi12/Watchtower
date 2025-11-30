import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const logSources = pgTable("log_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ipAddress: text("ip_address").notNull(),
  status: text("status").notNull().default("active"),
  description: text("description"),
});

export const insertLogSourceSchema = createInsertSchema(logSources).omit({
  id: true,
});

export type InsertLogSource = z.infer<typeof insertLogSourceSchema>;
export type LogSource = typeof logSources.$inferSelect;

export const logEntries = pgTable("log_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: varchar("source_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  severity: text("severity").notNull(),
  message: text("message").notNull(),
  analysisStatus: text("analysis_status").notNull().default("pending"),
  rawData: text("raw_data"),
});

export const insertLogEntrySchema = createInsertSchema(logEntries).omit({
  id: true,
  timestamp: true,
});

export type InsertLogEntry = z.infer<typeof insertLogEntrySchema>;
export type LogEntry = typeof logEntries.$inferSelect;

export const reportTemplates = pgTable("report_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  adminName: text("admin_name").notNull(),
  managerEmail: text("manager_email").notNull(),
  schedule: text("schedule").notNull().default("weekly"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReportTemplateSchema = createInsertSchema(reportTemplates).omit({
  id: true,
  createdAt: true,
});

export type InsertReportTemplate = z.infer<typeof insertReportTemplateSchema>;
export type ReportTemplate = typeof reportTemplates.$inferSelect;

export const reportRules = pgTable("report_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull(),
  ruleName: text("rule_name").notNull(),
  jobDescription: text("job_description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReportRuleSchema = createInsertSchema(reportRules).omit({
  id: true,
  createdAt: true,
});

export type InsertReportRule = z.infer<typeof insertReportRuleSchema>;
export type ReportRule = typeof reportRules.$inferSelect;

export const ruleEmployees = pgTable("rule_employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleId: varchar("rule_id").notNull(),
  username: text("username").notNull(),
  permissions: text("permissions"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRuleEmployeeSchema = createInsertSchema(ruleEmployees).omit({
  id: true,
  createdAt: true,
});

export type InsertRuleEmployee = z.infer<typeof insertRuleEmployeeSchema>;
export type RuleEmployee = typeof ruleEmployees.$inferSelect;
