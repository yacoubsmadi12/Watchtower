import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLogSourceSchema, insertLogEntrySchema, insertReportTemplateSchema, insertReportRuleSchema, insertRuleEmployeeSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/sources", async (req, res) => {
    try {
      const sources = await storage.getAllLogSources();
      res.json(sources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch log sources" });
    }
  });

  app.post("/api/sources", async (req, res) => {
    try {
      const validatedData = insertLogSourceSchema.parse(req.body);
      const source = await storage.createLogSource(validatedData);
      res.status(201).json(source);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create log source" });
      }
    }
  });

  app.put("/api/sources/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const source = await storage.updateLogSource(id, req.body);
      if (!source) {
        res.status(404).json({ error: "Log source not found" });
        return;
      }
      res.json(source);
    } catch (error) {
      res.status(500).json({ error: "Failed to update log source" });
    }
  });

  app.delete("/api/sources/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteLogSource(id);
      if (!deleted) {
        res.status(404).json({ error: "Log source not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete log source" });
    }
  });

  app.get("/api/logs", async (req, res) => {
    try {
      const { sourceId } = req.query;
      const logs = sourceId 
        ? await storage.getLogEntriesBySource(sourceId as string)
        : await storage.getAllLogEntries();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch log entries" });
    }
  });

  app.post("/api/logs", async (req, res) => {
    try {
      const validatedData = insertLogEntrySchema.parse(req.body);
      const entry = await storage.createLogEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create log entry" });
      }
    }
  });

  app.put("/api/logs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const entry = await storage.updateLogEntry(id, req.body);
      if (!entry) {
        res.status(404).json({ error: "Log entry not found" });
        return;
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to update log entry" });
    }
  });

  app.get("/api/reports/download", async (req, res) => {
    try {
      const { startDate, endDate, sourceId, templateId } = req.query;
      let logs = await storage.getAllLogEntries();
      
      if (sourceId) {
        logs = logs.filter(log => log.sourceId === sourceId);
      }
      
      if (startDate) {
        logs = logs.filter(log => new Date(log.timestamp) >= new Date(startDate as string));
      }
      
      if (endDate) {
        logs = logs.filter(log => new Date(log.timestamp) <= new Date(endDate as string));
      }
      
      const sources = await storage.getAllLogSources();
      const sourceMap = new Map(sources.map(s => [s.id, s]));
      
      let templateData = null;
      let rulesData: any[] = [];
      
      if (templateId) {
        const template = await storage.getReportTemplate(templateId as string);
        if (template) {
          templateData = template;
          const rules = await storage.getReportRulesByTemplate(templateId as string);
          for (const rule of rules) {
            const employees = await storage.getRuleEmployeesByRule(rule.id);
            rulesData.push({ ...rule, employees });
          }
        }
      }
      
      const report = {
        generatedAt: new Date().toISOString(),
        filters: { startDate, endDate, sourceId },
        template: templateData,
        rules: rulesData,
        summary: {
          totalLogs: logs.length,
          bySeverity: {
            critical: logs.filter(l => l.severity === 'critical').length,
            error: logs.filter(l => l.severity === 'error').length,
            warning: logs.filter(l => l.severity === 'warning').length,
            info: logs.filter(l => l.severity === 'info').length,
          },
          byAnalysisStatus: {
            pending: logs.filter(l => l.analysisStatus === 'pending').length,
            inProgress: logs.filter(l => l.analysisStatus === 'in-progress').length,
            completed: logs.filter(l => l.analysisStatus === 'completed').length,
          },
        },
        logs: logs.map(log => ({
          ...log,
          sourceName: sourceMap.get(log.sourceId)?.name || 'Unknown',
          sourceIp: sourceMap.get(log.sourceId)?.ipAddress || 'Unknown',
        })),
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=log-report-${Date.now()}.json`);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllReportTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getReportTemplate(id);
      if (!template) {
        res.status(404).json({ error: "Template not found" });
        return;
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const validatedData = insertReportTemplateSchema.parse(req.body);
      const template = await storage.createReportTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create template" });
      }
    }
  });

  app.put("/api/templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.updateReportTemplate(id, req.body);
      if (!template) {
        res.status(404).json({ error: "Template not found" });
        return;
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteReportTemplate(id);
      if (!deleted) {
        res.status(404).json({ error: "Template not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  app.get("/api/rules", async (req, res) => {
    try {
      const { templateId } = req.query;
      const rules = templateId 
        ? await storage.getReportRulesByTemplate(templateId as string)
        : await storage.getAllReportRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rules" });
    }
  });

  app.get("/api/rules/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const rule = await storage.getReportRule(id);
      if (!rule) {
        res.status(404).json({ error: "Rule not found" });
        return;
      }
      res.json(rule);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rule" });
    }
  });

  app.post("/api/rules", async (req, res) => {
    try {
      const validatedData = insertReportRuleSchema.parse(req.body);
      const rule = await storage.createReportRule(validatedData);
      res.status(201).json(rule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create rule" });
      }
    }
  });

  app.put("/api/rules/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const rule = await storage.updateReportRule(id, req.body);
      if (!rule) {
        res.status(404).json({ error: "Rule not found" });
        return;
      }
      res.json(rule);
    } catch (error) {
      res.status(500).json({ error: "Failed to update rule" });
    }
  });

  app.delete("/api/rules/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteReportRule(id);
      if (!deleted) {
        res.status(404).json({ error: "Rule not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete rule" });
    }
  });

  app.get("/api/employees", async (req, res) => {
    try {
      const { ruleId } = req.query;
      const employees = ruleId 
        ? await storage.getRuleEmployeesByRule(ruleId as string)
        : await storage.getAllRuleEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const validatedData = insertRuleEmployeeSchema.parse(req.body);
      const employee = await storage.createRuleEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create employee" });
      }
    }
  });

  app.post("/api/employees/bulk", async (req, res) => {
    try {
      const { ruleId, employees } = req.body;
      if (!ruleId || typeof ruleId !== 'string' || !Array.isArray(employees) || employees.length === 0) {
        res.status(400).json({ error: "Invalid request body: ruleId required and employees must be a non-empty array" });
        return;
      }
      
      const validationErrors: string[] = [];
      const validEmployees: { ruleId: string; username: string; permissions: string | null }[] = [];
      
      employees.forEach((emp: any, index: number) => {
        if (!emp || typeof emp.username !== 'string' || !emp.username.trim()) {
          validationErrors.push(`Employee at index ${index}: username is required and must be a non-empty string`);
        } else {
          validEmployees.push({
            ruleId,
            username: emp.username.trim(),
            permissions: typeof emp.permissions === 'string' ? emp.permissions.trim() || null : null,
          });
        }
      });
      
      if (validationErrors.length > 0) {
        res.status(400).json({ error: "Validation failed", details: validationErrors });
        return;
      }
      
      const createdEmployees = await storage.createRuleEmployeesBulk(validEmployees);
      res.status(201).json(createdEmployees);
    } catch (error) {
      res.status(500).json({ error: "Failed to create employees" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRuleEmployee(id);
      if (!deleted) {
        res.status(404).json({ error: "Employee not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete employee" });
    }
  });

  return httpServer;
}
