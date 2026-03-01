import { StrictMode, useState, useEffect } from 'react';
import { LayoutDashboard, Share2, FileText, AlertTriangle, PlayCircle, Shield, Search, Bell, User, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './pages/Dashboard';
import GraphView from './pages/GraphView';
import InvoiceFlow from './pages/InvoiceFlow';
import Alerts from './pages/Alerts';
import Simulation from './pages/Simulation';
import InvestigatorChat from './components/InvestigatorChat';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Intelligence Hub', icon: LayoutDashboard },
    { id: 'graph', label: 'Graph Topology', icon: Share2 },
    { id: 'flow', label: 'Event Ingestion', icon: FileText },
    { id: 'alerts', label: 'Audit Ledger', icon: AlertTriangle },
    { id: 'simulation', label: 'Stress Testing', icon: PlayCircle },
  ];

  return (
    <div className="flex h-screen bg-[#0A1628] text-slate-200 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 flex flex-col bg-[#0D1B2E]">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">NexusGuard</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activePage === item.id
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/30 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Event Stream</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Multi-tenant isolation active. Event-sourced audit ledger enabled.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-bottom border-slate-800 flex items-center justify-between px-8 bg-[#0A1628]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50 w-96">
            <Search size={18} className="text-slate-500" />
            <input 
              type="text" 
              placeholder="Search invoices, suppliers, or entities..." 
              className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0A1628]" />
            </button>
            <div className="h-8 w-px bg-slate-800" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">Compliance Officer</p>
                <p className="text-xs text-slate-500">Tier 1 Access</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center overflow-hidden">
                <User size={20} className="text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activePage === 'dashboard' && <Dashboard />}
              {activePage === 'graph' && <GraphView />}
              {activePage === 'flow' && <InvoiceFlow />}
              {activePage === 'alerts' && <Alerts />}
              {activePage === 'simulation' && <Simulation />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Chat Toggle */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-emerald-500 rounded-full shadow-2xl shadow-emerald-500/40 flex items-center justify-center text-white hover:scale-110 transition-transform z-50"
        >
          <MessageSquare size={24} />
        </button>

        <AnimatePresence>
          {isChatOpen && (
            <InvestigatorChat onClose={() => setIsChatOpen(false)} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
