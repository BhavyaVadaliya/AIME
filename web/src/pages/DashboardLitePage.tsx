import React, { useEffect, useState } from 'react';
import { Shield, Filter, BarChart3, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Signal {
    signal_id: string;
    correlation_id: string;
    structured_post?: {
        raw_text: string;
        classification: {
            primary_category: string;
            signal_type: string;
        };
        governance_route: {
            queue: string;
        };
        signal_score: {
            score: number;
        };
        priority_tier: string;
    };
    approval_status?: {
        state: string;
    };
}

export const DashboardLitePage: React.FC = () => {
    const [signals, setSignals] = useState<Signal[]>([]);
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterTier, setFilterTier] = useState('All');
    const [filterQueue, setFilterQueue] = useState('All');
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${API_URL}/admin/governance/signals`);
            const data = await response.json();
            // Data coming from logs are signal_lifecycle_report entries
            const simplified = data.map((entry: any) => ({
                signal_id: entry.signal_id,
                correlation_id: entry.correlation_id,
                structured_post: entry.structured_post?.data || entry.structured_post
            }));
            setSignals(simplified);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching signals:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Polling every 5s
        return () => clearInterval(interval);
    }, []);

    const filteredSignals = signals.filter(s => {
        const catMatch = filterCategory === 'All' || s.structured_post?.classification.primary_category === filterCategory;
        const tierMatch = filterTier === 'All' || s.structured_post?.priority_tier === filterTier;
        const queueMatch = filterQueue === 'All' || s.structured_post?.governance_route.queue === filterQueue;
        return catMatch && tierMatch && queueMatch;
    });

    const metrics = {
        total: filteredSignals.length,
        high: filteredSignals.filter(s => s.structured_post?.priority_tier === 'HIGH').length,
        med: filteredSignals.filter(s => s.structured_post?.priority_tier === 'MEDIUM').length,
        low: filteredSignals.filter(s => s.structured_post?.priority_tier === 'LOW').length,
        highRiskQueue: filteredSignals.filter(s => s.structured_post?.governance_route.queue === 'higher_risk').length,
    };

    const categories = ['All', ...new Set(signals.map(s => s.structured_post?.classification.primary_category).filter(Boolean)) as Set<string>];

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8 font-['Inter']">
            {/* Header */}
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                        Governance Dashboard <span className="text-slate-500 font-light text-2xl ml-2">Lite</span>
                    </h1>
                    <p className="text-slate-400 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        Live Signal Observability Layer (Read-Only)
                    </p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 flex gap-8">
                    <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Signals</p>
                        <p className="text-2xl font-mono text-white">{metrics.total}</p>
                    </div>
                    <div className="w-px bg-slate-700" />
                    <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">High Priority</p>
                        <p className="text-2xl font-mono text-red-400">{metrics.high}</p>
                    </div>
                </div>
            </header>

            {/* Metrics Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <MetricCard icon={<AlertTriangle className="text-red-400" />} label="High" value={metrics.high} color="border-red-500/30" bg="bg-red-500/5" />
                <MetricCard icon={<Clock className="text-amber-400" />} label="Medium" value={metrics.med} color="border-amber-500/30" bg="bg-amber-500/5" />
                <MetricCard icon={<CheckCircle2 className="text-emerald-400" />} label="Low" value={metrics.low} color="border-emerald-500/30" bg="bg-emerald-500/5" />
                <MetricCard icon={<BarChart3 className="text-blue-400" />} label="High Risk Queue" value={metrics.highRiskQueue} color="border-blue-500/30" bg="bg-blue-500/5" />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 mb-8 items-center bg-slate-800/30 p-4 rounded-xl border border-slate-700/30 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-400">Filters:</span>
                </div>
                <select 
                    value={filterCategory} 
                    onChange={e => setFilterCategory(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select 
                    value={filterTier} 
                    onChange={e => setFilterTier(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                >
                    <option value="All">All Tiers</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                </select>
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                    {['All', 'low_risk', 'higher_risk'].map(q => (
                        <button
                            key={q}
                            onClick={() => setFilterQueue(q)}
                            className={`px-4 py-1 text-xs rounded-md transition-all ${filterQueue === q ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            {q === 'All' ? 'All Queues' : q.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Signal Feed */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-20 animate-pulse text-slate-500">Connecting to node telemetry...</div>
                ) : filteredSignals.length === 0 ? (
                    <div className="text-center py-20 text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl">No signals matched current filters</div>
                ) : (
                    filteredSignals.map(signal => (
                        <div key={signal.signal_id} className="group relative bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 hover:border-slate-500/50 transition-all duration-300 rounded-2xl p-6 backdrop-blur-md overflow-hidden">
                            {/* Priority Indicator Line */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                signal.structured_post?.priority_tier === 'HIGH' ? 'bg-red-500' : 
                                signal.structured_post?.priority_tier === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                            
                            <div className="flex justify-between items-start">
                                <div className="flex-1 pr-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-tighter uppercase ${
                                            signal.structured_post?.priority_tier === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                                            signal.structured_post?.priority_tier === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        }`}>
                                            {signal.structured_post?.priority_tier}
                                        </span>
                                        <span className="text-slate-500 font-mono text-[10px]">{signal.signal_id}</span>
                                        <div className="h-1 w-1 rounded-full bg-slate-700" />
                                        <span className="text-slate-500 text-[10px] uppercase font-semibold">{signal.structured_post?.classification.primary_category}</span>
                                    </div>
                                    <p className="text-lg text-slate-100 font-medium leading-relaxed mb-4 leading-tight group-hover:text-white transition-colors capitalize">
                                        {signal.structured_post?.raw_text}
                                    </p>
                                    <div className="flex gap-4 items-center">
                                        <div className="flex items-center gap-1.5 bg-slate-900/50 px-3 py-1 rounded-lg border border-slate-700/50">
                                            <span className="text-[10px] text-slate-500 uppercase">Score</span>
                                            <span className="text-sm font-mono text-cyan-400 font-bold">{signal.structured_post?.signal_score.score}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-slate-900/50 px-3 py-1 rounded-lg border border-slate-700/50">
                                            <span className="text-[10px] text-slate-500 uppercase">Queue</span>
                                            <span className={`text-[10px] font-bold ${signal.structured_post?.governance_route.queue === 'higher_risk' ? 'text-red-400' : 'text-cyan-400'}`}>
                                                {signal.structured_post?.governance_route.queue.replace('_', ' ')}
                                            </span>
                                        </div>
                                        {signal.approval_status && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
                                                <span className="text-[10px] uppercase font-bold">{signal.approval_status.state}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <div className="text-[10px] text-slate-500 font-mono">{new Date().toLocaleTimeString()}</div>
                                    {signal.structured_post?.governance_route.queue === 'low_risk' && (
                                        <button className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white border border-slate-700 hover:border-slate-400 px-4 py-2 rounded-xl transition-all disabled:opacity-50" disabled>
                                            Observational Approval
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const MetricCard = ({ icon, label, value, color, bg }: { icon: React.ReactNode, label: string, value: number, color: string, bg: string }) => (
    <div className={`p-6 rounded-3xl border ${color} ${bg} backdrop-blur-sm transition-all hover:scale-[1.02]`}>
        <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-xl bg-slate-900/50">
                {icon}
            </div>
            <span className="text-3xl font-mono font-bold text-white">{value}</span>
        </div>
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
);

// End of file
