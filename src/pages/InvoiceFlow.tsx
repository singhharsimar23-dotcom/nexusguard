import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function InvoiceFlow() {
  const [formData, setFormData] = useState({
    supplier_id: 'SUP001',
    buyer_id: 'BUY001',
    lender_id: 'LND001',
    amount: 250000,
    quantity: 1000,
    po_number: 'PO-9921',
    goods_ref: 'GOODS-A1',
    tier: 1
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [stage, setStage] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    setStage(1);

    // Simulate pipeline stages
    setTimeout(() => setStage(2), 800);
    setTimeout(() => setStage(3), 1600);
    setTimeout(async () => {
      const res = await fetch('/api/v1/invoices/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResult(data);
      setStage(4);
      setIsSubmitting(false);
    }, 2400);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-full">
      {/* Form Section */}
      <div className="bg-slate-800/20 rounded-3xl p-8 border border-slate-800">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <Send className="text-indigo-500" />
          Industrial Event Ingestion
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Supplier</label>
              <select 
                className="w-full bg-slate-900 border-slate-700 rounded-xl text-sm p-3 focus:ring-emerald-500"
                value={formData.supplier_id}
                onChange={e => setFormData({...formData, supplier_id: e.target.value})}
              >
                <option value="SUP001">Apex Manufacturing (T1)</option>
                <option value="SUP002">MetalCore Ltd (T2)</option>
                <option value="SUP003">FastenParts Co (T3)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Buyer</label>
              <select 
                className="w-full bg-slate-900 border-slate-700 rounded-xl text-sm p-3 focus:ring-emerald-500"
                value={formData.buyer_id}
                onChange={e => setFormData({...formData, buyer_id: e.target.value})}
              >
                <option value="BUY001">Nexus Automotive Corp</option>
                <option value="BUY002">Global Fashion Group</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Amount ($)</label>
              <input 
                type="number" 
                className="w-full bg-slate-900 border-slate-700 rounded-xl text-sm p-3 focus:ring-emerald-500"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">PO Number</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border-slate-700 rounded-xl text-sm p-3 focus:ring-emerald-500"
                value={formData.po_number}
                onChange={e => setFormData({...formData, po_number: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Goods Reference</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 border-slate-700 rounded-xl text-sm p-3 focus:ring-emerald-500"
              value={formData.goods_ref}
              onChange={e => setFormData({...formData, goods_ref: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
            {isSubmitting ? 'Ingesting Event...' : 'Emit Ingestion Event'}
          </button>
        </form>
      </div>

      {/* Analysis Section */}
      <div className="flex flex-col gap-6">
        <AnimatePresence mode="wait">
          {stage > 0 ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-800/30 rounded-3xl p-8 border border-slate-800 flex-1"
            >
              <h3 className="text-xl font-bold mb-8">Risk Intelligence Pipeline</h3>
              
              <div className="space-y-6">
                <PipelineStep 
                  label="Document Validation (PO/GRN)" 
                  active={stage === 1} 
                  done={stage > 1} 
                />
                <PipelineStep 
                  label="Network Fingerprinting" 
                  active={stage === 2} 
                  done={stage > 2} 
                />
                <PipelineStep 
                  label="Graph Topology Analysis" 
                  active={stage === 3} 
                  done={stage > 3} 
                />
                <PipelineStep 
                  label="Bayesian Risk Scoring" 
                  active={stage === 4} 
                  done={stage > 4} 
                />
              </div>

              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 p-6 rounded-2xl bg-slate-900 border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">Final Verdict</p>
                      <VerdictBadge verdict={result.verdict} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">Risk Score</p>
                      <p className="text-3xl font-bold text-white">{(result.composite_score * 100).toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase">Active Risk Signals</p>
                    <div className="flex flex-wrap gap-2">
                      {result.active_signals && Array.isArray(result.active_signals) ? (
                        result.active_signals.map((s: string) => (
                          <span key={s} className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-bold">
                            {s.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-sm">No critical signals detected.</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <div className="h-full border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-600 p-12 text-center">
              <Activity size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">Submit an invoice to trigger the real-time risk intelligence pipeline.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PipelineStep({ label, active, done }: any) {
  return (
    <div className={`flex items-center gap-4 transition-all duration-300 ${active ? 'scale-105' : 'opacity-50'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
        done ? 'bg-emerald-500 border-emerald-500 text-white' : 
        active ? 'border-emerald-500 text-emerald-500 animate-pulse' : 
        'border-slate-700 text-slate-700'
      }`}>
        {done ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-current" />}
      </div>
      <span className={`font-bold ${active ? 'text-white' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
}

function VerdictBadge({ verdict }: any) {
  const colors = {
    BLOCK: 'bg-red-500 text-white',
    HOLD: 'bg-amber-500 text-white',
    WATCH: 'bg-blue-500 text-white',
    CLEAR: 'bg-emerald-500 text-white'
  };
  return (
    <span className={`px-4 py-1 rounded-full text-xs font-black tracking-widest ${colors[verdict as keyof typeof colors]}`}>
      {verdict}
    </span>
  );
}

function Activity({ size, className }: any) {
  return <Loader2 size={size} className={className} />;
}
