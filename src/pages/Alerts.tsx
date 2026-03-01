import { useState, useEffect } from 'react';
import { History, Shield, Database, Clock, ChevronRight, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [view, setView] = useState<'ledger' | 'events'>('ledger');

  const fetchData = async () => {
    try {
      const [alertsRes, eventsRes] = await Promise.all([
        fetch('/api/v1/alerts'),
        fetch('/api/v1/events')
      ]);
      const alertsData = await alertsRes.json();
      const eventsData = await eventsRes.json();
      if (Array.isArray(alertsData)) setAlerts(alertsData);
      if (Array.isArray(eventsData)) setEvents(eventsData);
    } catch (error) {
      console.error("Audit fetch error:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-500">
            <History size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Audit Ledger & Forensic Replay</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Immutable Event Stream Active</p>
          </div>
        </div>

        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
          <button 
            onClick={() => setView('ledger')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'ledger' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Risk Ledger
          </button>
          <button 
            onClick={() => setView('events')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'events' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Raw Event Stream
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
        {/* Main List */}
        <div className="lg:col-span-2 bg-slate-800/30 rounded-3xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 w-64">
              <Search size={14} className="text-slate-500" />
              <input type="text" placeholder="Filter audit logs..." className="bg-transparent border-none focus:ring-0 text-xs w-full" />
            </div>
            <button className="text-slate-500 hover:text-white"><Filter size={18} /></button>
          </div>

          <div className="overflow-y-auto flex-1">
            {view === 'ledger' ? (
              <table className="w-full text-left">
                <thead className="bg-slate-900/50 sticky top-0 backdrop-blur-md z-10">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800">
                    <th className="px-6 py-4">Verdict</th>
                    <th className="px-6 py-4">Aggregate ID</th>
                    <th className="px-6 py-4">Model</th>
                    <th className="px-6 py-4">Posterior</th>
                    <th className="px-6 py-4">Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {alerts.map((alert) => (
                    <tr 
                      key={alert.id} 
                      onClick={() => setSelectedItem(alert)}
                      className={`hover:bg-slate-700/30 cursor-pointer transition-colors ${selectedItem?.id === alert.id ? 'bg-indigo-500/5' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <VerdictBadge score={alert.posterior} />
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-white">{alert.invoice_id}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">{alert.model_version}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden w-16">
                            <div 
                              className={`h-full rounded-full ${alert.posterior > 0.8 ? 'bg-red-500' : 'bg-amber-500'}`} 
                              style={{ width: `${alert.posterior * 100}%` }} 
                            />
                          </div>
                          <span className="text-xs font-bold">{(alert.posterior * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {alert.explanation_status === 'COMPLETE' ? (
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-full">Ready</span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest animate-pulse">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 space-y-4">
                {events.map((event) => (
                  <div 
                    key={event.id}
                    onClick={() => setSelectedItem(event)}
                    className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                          <Database size={16} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-white">{event.event_type}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-600">v{event.version}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>ID: {event.id.slice(0, 8)}...</span>
                      <span>{new Date(event.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-slate-800/30 rounded-3xl border border-slate-800 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <motion.div 
                key={selectedItem.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Forensic Detail</h3>
                  <div className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {view === 'ledger' ? 'Risk Result' : 'Raw Event'}
                  </div>
                </div>

                {view === 'ledger' ? (
                  <div className="space-y-8">
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-700">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-4">AI Investigation Brief</p>
                      {selectedItem.explanation_status === 'COMPLETE' ? (
                        <p className="text-sm text-slate-300 leading-relaxed italic">
                          "{selectedItem.brief}"
                        </p>
                      ) : (
                        <div className="flex items-center gap-3 text-amber-500">
                          <Clock size={16} className="animate-spin" />
                          <span className="text-xs font-bold uppercase tracking-widest">Explanation Pending...</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-bold text-slate-500 uppercase">Risk Signals Used</p>
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(selectedItem.signals_used || '[]').map((s: string) => (
                          <span key={s} className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-bold">
                            {s.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-8 border-t border-slate-800">
                      <p className="text-[10px] font-bold text-slate-600 uppercase mb-4">Deterministic Verification</p>
                      <div className="p-4 bg-slate-900/50 rounded-xl font-mono text-[10px] text-slate-500 break-all">
                        SNAPSHOT_HASH: {selectedItem.graph_snapshot_hash}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase">Event Hash Chain</p>
                      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                        <div>
                          <p className="text-[10px] text-slate-600 uppercase font-bold mb-1">Current Hash</p>
                          <p className="text-[10px] font-mono text-indigo-400 break-all">{selectedItem.event_hash}</p>
                        </div>
                        <div className="pt-3 border-t border-slate-800">
                          <p className="text-[10px] text-slate-600 uppercase font-bold mb-1">Previous Hash</p>
                          <p className="text-[10px] font-mono text-slate-500 break-all">{selectedItem.previous_hash}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase">Payload Data</p>
                      <pre className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-x-auto">
                        {JSON.stringify(JSON.parse(selectedItem.payload), null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-600">
                <Shield size={48} className="mb-4 opacity-20" />
                <p className="font-medium">Select an entry from the {view === 'ledger' ? 'ledger' : 'stream'} to perform forensic analysis.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function VerdictBadge({ score }: { score: number }) {
  const verdict = score >= 0.8 ? 'BLOCK' : score >= 0.55 ? 'HOLD' : 'CLEAR';
  const colors = {
    BLOCK: 'bg-red-500 text-white',
    HOLD: 'bg-amber-500 text-white',
    CLEAR: 'bg-emerald-500 text-white'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${colors[verdict]}`}>
      {verdict}
    </span>
  );
}
