import { Database } from "better-sqlite3";

export class GraphEngine {
  private db: Database;
  private tenantId: string;

  constructor(db: Database, tenantId: string) {
    this.db = db;
    this.tenantId = tenantId;
  }

  /**
   * Rebuilds the computation graph from the persistent store (nodes/edges tables).
   * In a real production system, this would be cached in Redis.
   */
  public async getAdjacencyList() {
    const edges = this.db.prepare("SELECT source_id, target_id, type FROM edges WHERE tenant_id = ?").all(this.tenantId) as any[];
    const adj: Record<string, string[]> = {};
    
    edges.forEach(edge => {
      if (!adj[edge.source_id]) adj[edge.source_id] = [];
      adj[edge.source_id].push(edge.target_id);
    });
    
    return adj;
  }

  /**
   * Detects cycles in the graph using DFS.
   * Essential for Carousel Trade detection.
   */
  public async detectCycles(): Promise<string[][]> {
    const adj = await this.getAdjacencyList();
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (node: string, path: string[]) => {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      const neighbors = adj[node] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recStack.has(neighbor)) {
          // Cycle detected
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) {
            cycles.push(path.slice(cycleStart));
          }
        }
      }

      recStack.delete(node);
    };

    Object.keys(adj).forEach(node => {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    });

    return cycles;
  }

  /**
   * Calculates a simple betweenness centrality mock.
   * In production, this would use a library like NetworkX or a graph DB.
   */
  public async getCentrality(nodeId: string): Promise<number> {
    const adj = await this.getAdjacencyList();
    let count = 0;
    Object.values(adj).forEach(neighbors => {
      if (neighbors.includes(nodeId)) count++;
    });
    const totalNodes = Object.keys(adj).length || 1;
    return count / totalNodes;
  }

  /**
   * Ingests a new relationship into the graph.
   */
  public addEdge(sourceId: string, targetId: string, type: string) {
    const id = `edge-${sourceId}-${targetId}-${type}`;
    this.db.prepare(`
      INSERT OR REPLACE INTO edges (id, tenant_id, source_id, target_id, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, this.tenantId, sourceId, targetId, type);
  }

  public addNode(id: string, type: string, metadata: any) {
    this.db.prepare(`
      INSERT OR REPLACE INTO nodes (id, tenant_id, type, metadata)
      VALUES (?, ?, ?, ?)
    `).run(id, this.tenantId, type, JSON.stringify(metadata));
  }
}
