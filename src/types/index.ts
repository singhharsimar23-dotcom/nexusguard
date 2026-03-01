import { GoogleGenAI } from "@google/genai";

export interface DashboardStats {
  total_invoices_today: { count: number };
  blocked_count: { count: number };
  held_count: { count: number };
  total_exposure_at_risk: { sum: number | null };
  avg_cascade_multiplier: number;
  graph_node_count: number;
  graph_edge_count: number;
  risk_score_distribution: {
    BLOCK: { count: number };
    HOLD: { count: number };
    WATCH: { count: number };
    CLEAR: { count: number };
  };
}

export interface Alert {
  id: string;
  invoice_id: string;
  verdict: 'BLOCK' | 'HOLD' | 'WATCH' | 'CLEAR';
  score: number;
  typology: string;
  details: string;
  supplier_id: string;
  supplier_name: string;
  amount: number;
  created_at: string;
}

export interface GraphData {
  nodes: any[];
  edges: any[];
}
