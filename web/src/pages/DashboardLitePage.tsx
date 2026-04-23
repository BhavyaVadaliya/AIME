import React, { useEffect, useState } from 'react';
import { Shield, Filter, BarChart3, Clock, AlertTriangle, CheckCircle2, Layers, Box, Info } from 'lucide-react';
import { SignalDetailPanel } from '../components/SignalDetailPanel';

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
        source?: {
            platform: string;
            username: string;
            author_id: string;
            source_url: string;
            timestamp: string;
        };
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
    const [showLowValue, setShowLowValue] = useState(false);
    const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

    const fetchData = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/admin/governance/signals`);
            const data = await response.json();
            
            // Map signals and group by text
            const mapped = data.map((entry: any) => ({
                signal_id: entry.signal_id,
                correlation_id: entry.correlation_id,
                structured_post: entry.structured_post?.data || entry.structured_post
            }));

            setSignals(mapped);
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

    // UI GROUPING LOGIC (S11-T01 requirement: NO backend deduplication)
    const processedSignals = React.useMemo(() => {
        const groups: Record<string, { signal: Signal, count: number }> = {};
        
        signals.forEach(s => {
            const key = s.structured_post?.raw_text || s.signal_id;
            if (!groups[key]) {
                groups[key] = { signal: s, count: 1 };
            } else {
                groups[key].count += 1;
            }
        });

        return Object.values(groups);
    }, [signals]);

    const filteredSignals = processedSignals.filter(({ signal: s }) => {
        const catMatch = filterCategory === 'All' || s.structured_post?.classification.primary_category === filterCategory;
        const tierMatch = filterTier === 'All' || s.structured_post?.priority_tier === filterTier;
        const queueMatch = filterQueue === 'All' || s.structured_post?.governance_route.queue === filterQueue;
        return catMatch && tierMatch && queueMatch;
    });

    const metrics = {
        total: signals.length,
        unique: processedSignals.length,
        high: signals.filter(s => s.structured_post?.priority_tier === 'HIGH').length,
        med: signals.filter(s => s.structured_post?.priority_tier === 'MEDIUM').length,
        low: signals.filter(s => s.structured_post?.priority_tier === 'LOW').length,
        highRiskQueue: signals.filter(s => s.structured_post?.governance_route.queue === 'higher_risk').length,
    };

    const categories = ['All', ...new Set(signals.map(s => s.structured_post?.classification.primary_category).filter(Boolean)) as Set<string>];

    const mapCategoryLabel = (cat: string) => cat === 'UNCLASSIFIED' ? 'General' : cat;

    const isLowValue = (s: Signal) => s.structured_post?.priority_tier === 'LOW' && (s.structured_post?.signal_score?.score || 0) <= 3;

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
                    <>
                        {filteredSignals.filter(({ signal: s }) => !isLowValue(s)).map(({ signal, count }) => (
                            <SignalRow 
                                key={signal.signal_id} 
                                signal={signal} 
                                count={count} 
                                mapCategoryLabel={mapCategoryLabel} 
                                onClick={() => setSelectedSignal(signal)}
                            />
                        ))}

                        {/* Low Value Signals Section */}
                        {filteredSignals.some(({ signal: s }) => isLowValue(s)) && (
                            <div className="mt-8">
                                <button 
                                    onClick={() => setShowLowValue(!showLowValue)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-sm transition-all"
                                >
                                    <div className="flex items-center gap-2">
                                        <Info className="w-4 h-4" />
                                        <span>{filteredSignals.filter(({ signal: s }) => isLowValue(s)).length} Low Value Signals {showLowValue ? 'Visible' : 'Hidden'}</span>
                                    </div>
                                    <span>{showLowValue ? 'Collapse' : 'Expand'}</span>
                                </button>
                                
                                {showLowValue && (
                                    <div className="space-y-4 mt-4 opacity-70 grayscale-[0.3]">
                                        {filteredSignals.filter(({ signal: s }) => isLowValue(s)).map(({ signal, count }) => (
                                            <SignalRow 
                                                key={signal.signal_id} 
                                                signal={signal} 
                                                count={count} 
                                                mapCategoryLabel={mapCategoryLabel} 
                                                isLowValue 
                                                onClick={() => setSelectedSignal(signal)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <SignalDetailPanel 
                signal={selectedSignal} 
                onClose={() => setSelectedSignal(null)} 
                mapCategoryLabel={mapCategoryLabel} 
            />
        </div>
    );
};

const SignalRow = ({ signal, count, mapCategoryLabel, isLowValue = false, onClick }: { signal: Signal, count: number, mapCategoryLabel: (c: string) => string, isLowValue?: boolean, onClick: () => void }) => {
    const s = signal.structured_post;
    const isSourceUnknown = !s?.source || s.source.platform === 'unknown' || s.source.username === 'unknown';

    return (
        <div 
            onClick={onClick}
            className={`group relative bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 hover:border-slate-500/50 transition-all duration-300 rounded-2xl p-6 backdrop-blur-md overflow-hidden cursor-pointer active:scale-[0.99] ${isLowValue ? 'border-dashed' : ''}`}
        >
            {/* Priority Indicator Line */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                s?.priority_tier === 'HIGH' ? 'bg-red-500' : 
                s?.priority_tier === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
            } ${s?.priority_tier === 'HIGH' ? 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''}`} />
            
            <div className="flex justify-between items-start">
                <div className="flex-1 pr-6">
                    <div className="flex items-center gap-3 mb-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-tighter uppercase ${
                            s?.priority_tier === 'HIGH' ? 'bg-red-500 text-white border border-red-400' : 
                            s?.priority_tier === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                            {s?.priority_tier}
                        </span>
                        
                        {count > 1 && (
                            <div className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
                                <Layers className="w-3 h-3" />
                                x{count}
                            </div>
                        )}

                        <span className="text-slate-500 font-mono text-[10px]" title="Signal ID">{signal.signal_id}</span>
                        <div className="h-1 w-1 rounded-full bg-slate-700" />
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider" title={`Original classification: ${s?.classification.primary_category}`}>
                            {mapCategoryLabel(s?.classification.primary_category || 'UNCLASSIFIED')}
                        </span>
                    </div>

                    <p className={`text-lg transition-colors capitalize mb-4 ${
                        s?.priority_tier === 'HIGH' ? 'text-white font-semibold' : 
                        s?.priority_tier === 'MEDIUM' ? 'text-slate-100 font-medium' : 'text-slate-400 font-normal italic'
                    }`}>
                        {s?.raw_text}
                    </p>

                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2">
                            {isSourceUnknown ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-red-900/10 border border-red-500/20 rounded-lg text-red-500/70 text-[10px] font-bold uppercase italic">
                                    <AlertTriangle className="w-3 h-3" />
                                    Source Unavailable
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="bg-slate-900 border border-slate-700 text-cyan-400 text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                                        {s?.source?.platform.toUpperCase()}
                                    </span>
                                    <span className="text-slate-400 text-[10px] font-medium italic">
                                        @{s?.source?.username}
                                    </span>
                                    {s?.source?.source_url && (
                                        <a href={s.source.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-cyan-500 hover:text-cyan-400 underline underline-offset-2 ml-1">
                                            View Source
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {new Date().toLocaleTimeString()}
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-700/50">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Score</span>
                        <span className={`text-sm font-mono font-black ${s?.priority_tier === 'HIGH' ? 'text-cyan-400' : 'text-slate-400'}`}>
                            {s?.signal_score.score}
                        </span>
                    </div>
                    <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest text-right mt-1">
                        Queue: {s?.governance_route.queue.replace('_', ' ')}
                    </div>
                </div>
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
