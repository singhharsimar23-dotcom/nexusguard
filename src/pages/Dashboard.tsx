import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, ShieldAlert, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DashboardStats } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const { lastMessage } = useWebSocket('/ws/alerts');

  const fetchStats = async () => {
    const res = await fetch('/api/v1/stats/dashboard');
    const data = await res.json();
    setStats(data);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (lastMessage) {
      fetchStats();
    }
  }, [lastMessage]);

  if (!stats) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-800/50 rounded-3xl" />)}
    </div>
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 h-96 bg-slate-800/50 rounded-3xl" />
      <div className="h-96 bg-slate-800/50 rounded-3xl" />
    </div>
  </div>;

  const riskData = [
    { name: 'BLOCK', value: stats.risk_score_distribution?.BLOCK?.count ?? 0, color: '#EF4444' },
    { name: 'HOLD', value: stats.risk_score_distribution?.HOLD?.count ?? 0, color: '#F59E0B' },
    { name: 'WATCH', value: stats.risk_score_distribution?.WATCH?.count ?? 0, color: '#3B82F6' },
    { name: 'CLEAR', value: stats.risk_score_distribution?.CLEAR?.count ?? 0, color: '#10B981' },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Events Today" 
          value={stats.total_invoices_today?.count ?? 0} 
          icon={Activity} 
          trend="+12%" 
          trendUp={true}
        />
        <KPICard 
          title="Flagged Aggregates" 
          value={(stats.blocked_count?.count ?? 0) + (stats.held_count?.count ?? 0)} 
          icon={ShieldAlert} 
          trend="+2" 
          trendUp={false}
          color="text-red-400"
        />
        <KPICard 
          title="Exposure at Risk" 
          value={`$${((stats.total_exposure_at_risk?.sum || 0) / 1000000).toFixed(2)}M`} 
          icon={AlertCircle} 
          trend="-5%" 
          trendUp={true}
        />
        <KPICard 
          title="P95 Scoring Latency" 
          value="1.12s" 
          icon={TrendingUp} 
          trend="SLO Met" 
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Risk Distribution */}
        <div className="lg:col-span-2 bg-slate-800/30 rounded-3xl p-8 border border-slate-800">
          <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
            <Activity className="text-emerald-500" size={20} />
            Risk Score Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px' }}
                  itemStyle={{ color: '#E2E8F0' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-slate-800/30 rounded-3xl p-8 border border-slate-800">
          <h3 className="text-lg font-bold mb-8">Verdict Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {riskData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-400">{item.name}</span>
                </div>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, trend, trendUp, color = "text-emerald-400" }: any) {
  return (
    <div className="bg-slate-800/30 rounded-3xl p-6 border border-slate-800 hover:border-slate-700 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className={color} size={24} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h4 className="text-3xl font-bold text-white tracking-tight">{value}</h4>
    </div>
  );
}
