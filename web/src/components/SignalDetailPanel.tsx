import React, { useEffect } from 'react';
import { X, Shield, Activity, Share2, ChevronRight, FileJson } from 'lucide-react';
import { SignalScoreBreakdown } from './SignalScoreBreakdown';
import { SignalSourceBlock } from './SignalSourceBlock';
import { SignalClassificationBlock } from './SignalClassificationBlock';
import { SuggestedReplyPanel } from './SuggestedReplyPanel';

interface Signal {
    signal_id: string;
    correlation_id: string;
    structured_post?: {
        raw_text: string;
        classification: {
            primary_category: string;
            signal_type: string;
            context_tags?: string[];
        };
        signal_score: {
            score: number;
            category_weight?: number;
            type_adjustment?: number;
            pattern_boost?: number;
        };
        priority_tier: string;
        governance_route: {
            queue: string;
        };
        source: {
            platform: string;
            username: string;
            author_id: string;
            source_url: string;
            timestamp: string;
        };
    };
}

interface PanelProps {
    signal: Signal | null;
    onClose: () => void;
    mapCategoryLabel: (c: string) => string;
}

export const SignalDetailPanel: React.FC<PanelProps> = ({ signal, onClose, mapCategoryLabel }) => {
    // Prevent body scroll when panel is open
    useEffect(() => {
        if (signal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [signal]);

    if (!signal) return null;

    const s = signal.structured_post;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative w-full max-w-xl bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                            s?.priority_tier === 'HIGH' ? 'bg-red-500 animate-pulse' : 
                            s?.priority_tier === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <div>
                            <h2 className="text-white font-black uppercase tracking-tighter text-xl">Signal Detail</h2>
                            <p className="text-[10px] text-slate-500 font-mono">ID: {signal.signal_id}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Raw Text Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Share2 className="w-4 h-4 text-slate-500" />
                            <h3 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Signal Intelligence Payload</h3>
                        </div>
                        <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 shadow-inner">
                            <p className="text-lg text-slate-100 leading-relaxed font-medium">
                                {s?.raw_text}
                            </p>
                        </div>
                    </section>

                    {/* Classification & Score Grid */}
                    <div className="grid grid-cols-1 gap-6">
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-4 h-4 text-slate-500" />
                                <h3 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Classification Truth</h3>
                            </div>
                            <SignalClassificationBlock 
                                classification={{
                                    primary_category: s?.classification.primary_category || 'UNCLASSIFIED',
                                    signal_type: s?.classification.signal_type || 'unclassified',
                                    context_tags: s?.classification.context_tags,
                                    mapCategoryLabel
                                }} 
                            />
                        </section>

                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <Activity className="w-4 h-4 text-slate-500" />
                                <h3 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Intelligence Ranking</h3>
                            </div>
                            {s?.signal_score && (
                                <SignalScoreBreakdown scoreData={s.signal_score} />
                            )}
                        </section>
                    </div>

                    {/* Operator Assistant Section (S11-T04) */}
                    <section>
                        <SuggestedReplyPanel 
                            category={s?.classification.primary_category || 'UNCLASSIFIED'}
                            type={s?.classification.signal_type || 'unclassified'}
                            rawText={s?.raw_text || ''}
                        />
                    </section>

                    {/* Governance Context */}
                    <section className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-cyan-500" />
                                <h3 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Governance Queue</h3>
                            </div>
                            <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-[10px] font-bold uppercase">
                                {s?.governance_route.queue.replace(/_/g, ' ')}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium">System Status</span>
                            <span className="text-emerald-400 font-bold uppercase tracking-wider">Awaiting Operator Engagement</span>
                        </div>
                    </section>

                    {/* Source Section */}
                    <section>
                        {s?.source && (
                            <SignalSourceBlock source={s.source} />
                        )}
                    </section>

                    {/* Technical Details (Collapsible) */}
                    <details className="group border border-slate-800 rounded-xl overflow-hidden">
                        <summary className="p-4 bg-slate-900 cursor-pointer flex justify-between items-center hover:bg-slate-800 transition-colors">
                            <div className="flex items-center gap-2 text-slate-500">
                                <FileJson className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Raw System JSON</span>
                            </div>
                            <div className="text-slate-600 transition-transform group-open:rotate-180">
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </summary>
                        <div className="p-4 bg-slate-950 font-mono text-[10px] text-emerald-500/80 overflow-x-auto">
                            <pre>{JSON.stringify(signal, null, 2)}</pre>
                        </div>
                    </details>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all border border-slate-700"
                    >
                        Close Detail View
                    </button>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
            `}</style>
        </div>
    );
};
