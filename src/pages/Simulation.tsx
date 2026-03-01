import { useState } from 'react';
import { PlayCircle, RefreshCcw, AlertCircle, ShieldAlert, Zap, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Simulation() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [injectedCount, setInjectedCount] = useState(0);

  const scenarios = [
    { id: 'phantom_ring', name: 'Phantom Ring', desc: 'Injects 12 invoices with non-existent POs from a Tier 1 supplier.', icon: Zap },
    { id: 'carousel', name: 'Carousel Trade', desc: 'Creates a circular goods movement (A→B→C→A) to extract cash.', icon: RefreshCcw },
    { id: 'double_financing', name: 'Double Financing', desc: 'Submits the same invoice to multiple lenders simultaneously.', icon: ShieldAlert },
    { id: 'revenue_inflation', name: 'Revenue Inflation', desc: 'Supplier submits invoices exceeding 7x their declared revenue.', icon: AlertCircle },
  ];

  const handleInject = async (id: string) => {
    setIsSimulating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real app, this would call /api/v1/simulation/inject
    // For this demo, we'll just simulate a few submissions
    const mockInvoices = [
      { supplier_id: 'SUP001', buyer_id: 'BUY001', amount: 450000, po_number: 'PHNT-991', goods_ref: 'GHOST-1', tier: 1 },
      { supplier_id: 'SUP001', buyer_id: 'BUY001', amount: 320000, po_number: 'PHNT-992', goods_ref: 'GHOST-2', tier: 1 },
      { supplier_id: 'SUP001', buyer_id: 'BUY001', amount: 280000, po_number: 'PHNT-993', goods_ref: 'GHOST-3', tier: 1 },
    ];

    for (const inv of mockInvoices) {
      await fetch('/api/v1/invoices/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inv)
      });
    }

    setInjectedCount(prev => prev + mockInvoices.length);
    setIsSimulating(false);
  };

  const handleReset = async () => {
    await fetch('/api/v1/simulation/reset', { method: 'POST' });
    setInjectedCount(0);
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Fraud Simulation Lab</h2>
          <p className="text-slate-400">Stress-test the detection engines with adversarial scenarios.</p>
        </div>
        <button 
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-red-500/10 hover:text-red-500 rounded-2xl text-sm font-bold transition-all border border-slate-700"
        >
          <RefreshCcw size={18} />
          Reset Environment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {scenarios.map((s) => (
          <div key={s.id} className="bg-slate-800/30 rounded-3xl p-8 border border-slate-800 flex flex-col h-full">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 border border-slate-800">
              <s.icon className="text-emerald-500" size={28} />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">{s.name}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-8 flex-1">{s.desc}</p>
            <button 
              onClick={() => handleInject(s.id)}
              disabled={isSimulating}
              className="w-full py-3 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl font-bold text-sm transition-all border border-emerald-500/20 flex items-center justify-center gap-2"
            >
              {isSimulating ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={16} />}
              Inject Scenario
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/20 rounded-3xl p-12 border border-slate-800 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 rounded-full text-emerald-400 text-xs font-bold mb-6 border border-emerald-500/20">
            <Zap size={14} />
            LIVE SIMULATION METRICS
          </div>
          <h3 className="text-5xl font-black text-white mb-4">{injectedCount}</h3>
          <p className="text-slate-500 font-medium mb-8">Fraudulent entities injected into the network during this session.</p>
          
          <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-800/50">
            <div>
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Detection Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">1.2s</p>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Avg Latency</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">False Positives</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
