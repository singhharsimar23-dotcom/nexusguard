import { useState, useEffect } from 'react';
import { Share2, Activity, Shield, Filter, Maximize2, RefreshCcw, Loader2 } from 'lucide-react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';

const nodeTypes = {
  supplier: SupplierNode,
  buyer: BuyerNode,
  invoice: InvoiceNode,
};

export default function GraphView() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGraph = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/graph/export');
      const data = await res.json();
      
      if (data && Array.isArray(data.nodes)) {
        setNodes(data.nodes);
      }
      if (data && Array.isArray(data.edges)) {
        setEdges(data.edges);
      }
    } catch (error) {
      console.error("Failed to fetch graph:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-500">
            <Share2 size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Graph Topology Explorer</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Real-time Computation Graph</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchGraph} className="p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
            <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button className="flex items-center gap-2 px-4 py-3 bg-slate-800 rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors">
            <Filter size={18} />
            Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-3 bg-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">
            <Maximize2 size={18} />
            Full Screen
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#0D1B2E] rounded-3xl border border-slate-800 overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-indigo-500" size={48} />
              <p className="text-sm font-bold text-white uppercase tracking-widest">Reconstructing Topology...</p>
            </div>
          </div>
        )}
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#1E293B" gap={20} />
          <Controls />
          <MiniMap 
            style={{ backgroundColor: '#0F172A' }} 
            nodeColor={(n) => {
              if (n.type === 'supplier') return '#6366F1';
              if (n.type === 'buyer') return '#3B82F6';
              return '#64748B';
            }}
          />
        </ReactFlow>

        <div className="absolute top-6 left-6 bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 z-10 shadow-2xl">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Topology Legend</h3>
          <div className="space-y-3">
            <LegendItem color="bg-indigo-500" label="Supplier (Tier 1-3)" />
            <LegendItem color="bg-blue-500" label="Buyer Entity" />
            <LegendItem color="bg-slate-500" label="Invoice Aggregate" />
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-indigo-500" />
                <span className="text-[10px] text-slate-400 font-bold uppercase">Issuance Flow</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-8 h-0.5 bg-slate-500" />
                <span className="text-[10px] text-slate-400 font-bold uppercase">Payment Flow</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${color} shadow-lg shadow-current/20`} />
      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
}

function SupplierNode({ data }: any) {
  return (
    <div className="px-4 py-3 shadow-2xl rounded-xl bg-indigo-600 border-2 border-indigo-400 text-white min-w-[140px]">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[8px] font-black uppercase opacity-70 tracking-widest">Supplier</div>
        <Shield size={10} className="opacity-50" />
      </div>
      <div className="font-bold text-xs truncate">{data.label}</div>
      <div className="mt-2 pt-2 border-t border-indigo-400/30 flex items-center justify-between">
        <span className="text-[8px] font-bold opacity-70">TIER {data.tier || 1}</span>
        <Activity size={10} className="opacity-50" />
      </div>
    </div>
  );
}

function BuyerNode({ data }: any) {
  return (
    <div className="px-4 py-3 shadow-2xl rounded-xl bg-blue-600 border-2 border-blue-400 text-white min-w-[140px]">
      <div className="text-[8px] font-black uppercase opacity-70 tracking-widest mb-1">Buyer Entity</div>
      <div className="font-bold text-xs truncate">{data.label}</div>
    </div>
  );
}

function InvoiceNode({ data }: any) {
  return (
    <div className="px-3 py-2 shadow-2xl rounded-lg bg-slate-700 border-2 border-slate-500 text-white text-center min-w-[100px]">
      <div className="text-[8px] font-black uppercase opacity-70 tracking-widest mb-1">Invoice</div>
      <div className="font-mono text-[10px] font-bold">${(data.amount || 0).toLocaleString()}</div>
    </div>
  );
}
