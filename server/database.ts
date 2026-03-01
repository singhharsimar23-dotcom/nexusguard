import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function setupDatabase() {
  const db = new Database(path.join(__dirname, "../../pioneer.db"));
  
  // Initialize tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      aggregate_id TEXT NOT NULL,
      aggregate_type TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      version INTEGER NOT NULL,
      previous_hash TEXT,
      event_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(tenant_id) REFERENCES tenants(id)
    );

    CREATE TABLE IF NOT EXISTS risk_models (
      id TEXT PRIMARY KEY,
      version TEXT NOT NULL,
      priors TEXT NOT NULL,
      likelihoods TEXT NOT NULL,
      calibration_dataset_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS risk_results (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      model_version TEXT NOT NULL,
      posterior REAL NOT NULL,
      signals_used TEXT,
      graph_snapshot_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(invoice_id, model_version)
    );

    CREATE TABLE IF NOT EXISTS explanations (
      invoice_id TEXT PRIMARY KEY,
      status TEXT DEFAULT 'PENDING',
      retry_count INTEGER DEFAULT 0,
      last_error TEXT,
      generated_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      type TEXT NOT NULL,
      metadata TEXT,
      risk_score REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS edges (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      type TEXT NOT NULL,
      weight REAL DEFAULT 1.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      supplier_id TEXT,
      buyer_id TEXT,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'SUBMITTED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: Add tenant_id to tables if missing (for existing DBs)
  const tables = ['events', 'risk_results', 'nodes', 'edges', 'invoices'];
  tables.forEach(table => {
    const info = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    const hasTenantId = info.some(col => col.name === 'tenant_id');
    if (!hasTenantId) {
      try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'TENANT-001'`);
      } catch (e) {
        console.error(`Migration failed for ${table}:`, e);
      }
    }
  });

  // Seed initial data
  const tenantCount = db.prepare("SELECT COUNT(*) as count FROM tenants").get() as { count: number };
  if (tenantCount.count === 0) {
    const insertTenant = db.prepare("INSERT INTO tenants (id, name) VALUES (?, ?)");
    insertTenant.run("TENANT-001", "Global Trade Bank");
    
    const insertModel = db.prepare("INSERT INTO risk_models (id, version, priors, likelihoods) VALUES (?, ?, ?, ?)");
    insertModel.run("MODEL-V1", "1.0.0", JSON.stringify({ base: 0.02 }), JSON.stringify({ duplicate: 45.0 }));
  }

  return db;
}
