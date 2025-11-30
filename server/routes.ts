import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLogSourceSchema, insertLogEntrySchema } from "@shared/schema";
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

  app.get("/api/reports", async (req, res) => {
    try {
      const { startDate, endDate, sourceId } = req.query;
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
      
      const report = {
        generatedAt: new Date().toISOString(),
        filters: { startDate, endDate, sourceId },
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

  return httpServer;
}
