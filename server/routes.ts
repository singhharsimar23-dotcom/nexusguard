import { Express } from "express";
import { Database } from "better-sqlite3";
import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { runScoringPipeline } from "./engines/orchestrator.js";

export function registerRoutes(app: Express, db: Database, wss: WebSocketServer) {
  
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  /**
   * EVENT SOURCING CORE
   * Every state change is recorded as an immutable event with a hash chain.
   */
  const appendEvent = (tenantId: string, aggregateId: string, aggregateType: string, eventType: string, payload: any) => {
    const lastEvent = db.prepare("SELECT event_hash FROM events WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 1").get(tenantId) as { event_hash: string } | undefined;
    const previousHash = lastEvent?.event_hash || "0";
    const version = (db.prepare("SELECT COUNT(*) as count FROM events WHERE aggregate_id = ?").get(aggregateId) as { count: number }).count + 1;
    
    const eventId = uuidv4();
    const payloadStr = JSON.stringify(payload);
    const eventHash = crypto.createHash('sha256').update(previousHash + eventId + payloadStr).digest('hex');

    db.prepare(`
      INSERT INTO events (id, tenant_id, aggregate_id, aggregate_type, event_type, payload, version, previous_hash, event_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(eventId, tenantId, aggregateId, aggregateType, eventType, payloadStr, version, previousHash, eventHash);
    
    return eventId;
  };

  /**
   * DASHBOARD API
   * Multi-tenant aware metrics derived from projections (risk_results, invoices).
   */
  app.get("/api/v1/stats/dashboard", (req, res) => {
    const tenantId = "TENANT-001"; // In production, derived from JWT
    try {
      const stats = {
        total_invoices_today: db.prepare("SELECT COUNT(*) as count FROM invoices WHERE tenant_id = ? AND date(created_at) = date('now')").get(tenantId) || { count: 0 },
        blocked_count: db.prepare("SELECT COUNT(*) as count FROM risk_results WHERE tenant_id = ? AND posterior >= 0.8").get(tenantId) || { count: 0 },
        held_count: db.prepare("SELECT COUNT(*) as count FROM risk_results WHERE tenant_id = ? AND posterior >= 0.55 AND posterior < 0.8").get(tenantId) || { count: 0 },
        total_exposure_at_risk: db.prepare("SELECT SUM(i.amount) as sum FROM invoices i JOIN risk_results r ON i.id = r.invoice_id WHERE i.tenant_id = ? AND r.posterior >= 0.55").get(tenantId) || { sum: 0 },
        avg_cascade_multiplier: 1.42,
        graph_node_count: db.prepare("SELECT COUNT(*) as count FROM nodes WHERE tenant_id = ?").get(tenantId) || { count: 0 },
        graph_edge_count: db.prepare("SELECT COUNT(*) as count FROM edges WHERE tenant_id = ?").get(tenantId) || { count: 0 },
        risk_score_distribution: {
          BLOCK: db.prepare("SELECT COUNT(*) as count FROM risk_results WHERE tenant_id = ? AND posterior >= 0.8").get(tenantId) || { count: 0 },
          HOLD: db.prepare("SELECT COUNT(*) as count FROM risk_results WHERE tenant_id = ? AND posterior >= 0.55 AND posterior < 0.8").get(tenantId) || { count: 0 },
          WATCH: db.prepare("SELECT COUNT(*) as count FROM risk_results WHERE tenant_id = ? AND posterior >= 0.3 AND posterior < 0.55").get(tenantId) || { count: 0 },
          CLEAR: db.prepare("SELECT COUNT(*) as count FROM risk_results WHERE tenant_id = ? AND posterior < 0.3").get(tenantId) || { count: 0 },
        }
      };
      res.json(stats);
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  /**
   * INGESTION API
   * Entry point for all invoice events.
   */
  app.post("/api/v1/invoices/submit", async (req, res) => {
    const tenantId = "TENANT-001";
    const invoiceId = req.body.id || `INV-${uuidv4().slice(0, 8).toUpperCase()}`;
    
    try {
      // 1. Record Ingestion Event
      appendEvent(tenantId, invoiceId, "Invoice", "InvoiceSubmitted", req.body);

      // 2. Update Projection (Invoices table)
      db.prepare(`
        INSERT INTO invoices (id, tenant_id, supplier_id, buyer_id, amount)
        VALUES (?, ?, ?, ?, ?)
      `).run(invoiceId, tenantId, req.body.supplier_id, req.body.buyer_id, req.body.amount);

      // 3. Run Scoring Pipeline (Stateless & Replayable)
      const result = await runScoringPipeline(req.body, db, tenantId);
      
      // 4. Record Scoring Event
      appendEvent(tenantId, invoiceId, "Invoice", "RiskScored", result);

      // 5. Persist Result Projection
      db.prepare(`
        INSERT INTO risk_results (id, invoice_id, tenant_id, model_version, posterior, signals_used, graph_snapshot_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), invoiceId, tenantId, result.model_version, result.composite_score, JSON.stringify(result.active_signals), "HASH-V1");

      // 6. Queue Explanation (Async)
      db.prepare("INSERT INTO explanations (invoice_id, status) VALUES (?, ?)").run(invoiceId, "PENDING");
      
      // Simulated background worker for Gemini explanation
      setTimeout(async () => {
        try {
          // In production, this calls narrator.py with the full engine breakdown
          const brief = `NexusGuard Analysis for ${invoiceId}: Detected ${result.active_signals.length} risk signals. Verdict: ${result.verdict}.`;
          db.prepare("UPDATE explanations SET status = ?, generated_text = ? WHERE invoice_id = ?").run("COMPLETE", brief, invoiceId);
          broadcast({ type: "explanation_ready", payload: { invoice_id: invoiceId, brief } });
        } catch (e) {
          db.prepare("UPDATE explanations SET status = ?, last_error = ? WHERE invoice_id = ?").run("FAILED", "Gemini API Timeout", invoiceId);
        }
      }, 3000);

      broadcast({ type: "new_alert", payload: { ...req.body, ...result } });
      res.json(result);
    } catch (error) {
      console.error("Ingestion error:", error);
      res.status(500).json({ error: "Ingestion pipeline failure" });
    }
  });

  /**
   * AUDIT LEDGER API
   * Returns risk results with linked explanations.
   */
  app.get("/api/v1/alerts", (req, res) => {
    const tenantId = "TENANT-001";
    try {
      const alerts = db.prepare(`
        SELECT r.*, i.amount, e.generated_text as brief, e.status as explanation_status
        FROM risk_results r
        JOIN invoices i ON r.invoice_id = i.id
        LEFT JOIN explanations e ON r.invoice_id = e.invoice_id
        WHERE r.tenant_id = ?
        ORDER BY r.created_at DESC
        LIMIT 50
      `).all(tenantId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit ledger" });
    }
  });

  /**
   * EVENT STREAM API
   * Forensic replay of all events for a tenant.
   */
  app.get("/api/v1/events", (req, res) => {
    const tenantId = "TENANT-001";
    try {
      const events = db.prepare("SELECT * FROM events WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 100").all(tenantId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event stream" });
    }
  });

  /**
   * GRAPH EXPORT API
   * Returns graph topology for visualization.
   */
  app.get("/api/v1/graph/export", (req, res) => {
    const tenantId = "TENANT-001";
    try {
      const nodes = db.prepare("SELECT id, type, metadata FROM nodes WHERE tenant_id = ?").all(tenantId) as any[];
      const edges = db.prepare("SELECT id, source_id, target_id, type FROM edges WHERE tenant_id = ?").all(tenantId) as any[];

      const flowNodes = nodes.map((n, i) => ({
        id: n.id,
        type: n.type,
        data: { label: n.id, ...JSON.parse(n.metadata || '{}') },
        position: { x: Math.random() * 800, y: Math.random() * 600 }
      }));

      const flowEdges = edges.map(e => ({
        id: e.id,
        source: e.source_id,
        target: e.target_id,
        label: e.type,
        animated: e.type === 'ISSUES'
      }));

      res.json({ nodes: flowNodes, edges: flowEdges });
    } catch (error) {
      res.status(500).json({ error: "Failed to export graph" });
    }
  });

  /**
   * SYSTEM RESET
   * Clears all tenant data (Simulation only).
   */
  app.post("/api/v1/simulation/reset", (req, res) => {
    try {
      db.exec("DELETE FROM events; DELETE FROM risk_results; DELETE FROM invoices; DELETE FROM explanations; DELETE FROM nodes; DELETE FROM edges;");
      res.json({ status: "ok" });
    } catch (error) {
      res.status(500).json({ error: "Reset failed" });
    }
  });
}
