import React, { useEffect, useState } from 'react';
import { X, Shield, Activity, Share2, ChevronRight, FileJson, MessageCircle } from 'lucide-react';
import { SignalScoreBreakdown } from './SignalScoreBreakdown';
import { SignalSourceBlock } from './SignalSourceBlock';
import { SignalClassificationBlock } from './SignalClassificationBlock';
import { SuggestedReplyPanel } from './SuggestedReplyPanel';
import { EngagementAnglePanel } from './EngagementAnglePanel';
import { RespondWorkspace } from './RespondWorkspace';
import { getEngagementContext } from '../utils/engagementLogic';

interface Signal {
    signal_id: string;
    correlation_id: string;
    is_synthetic?: boolean;
    qualification_state?: string;
    review_state?: string;
    approval_state?: string;
    followup_state?: string;
    selected_cta?: string;
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
        discussion_metadata?: any;
    };
}

interface PanelProps {
    signal: Signal | null;
    onClose: () => void;
    mapCategoryLabel: (c: string) => string;
}

export const SignalDetailPanel: React.FC<PanelProps> = ({ signal, onClose, mapCategoryLabel }) => {
    const [isRespondOpen, setIsRespondOpen] = useState(false);

    // Interactive Demo States for S15-T01 Validation
    const [reviewState, setReviewState] = useState<string>('Review Required');
    const [approvalState, setApprovalState] = useState<string>('Approval Required');
    const [followupState, setFollowupState] = useState<string>('Follow-Up Required');
    const [qualificationState, setQualificationState] = useState<string>('Review Required');
    const [demoCta, setDemoCta] = useState<string>('trust_only');

    // Prevent body scroll when panel is open
    useEffect(() => {
        if (signal) {
            document.body.style.overflow = 'hidden';
            if (signal.is_synthetic) {
                setReviewState(signal.review_state || 'Review Required');
                setApprovalState(signal.approval_state || 'Approval Required');
                setFollowupState(signal.followup_state || 'Follow-Up Required');
                setQualificationState(signal.qualification_state || 'Review Required');
                setDemoCta(signal.selected_cta || 'trust_only');
            }
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [signal]);

    if (!signal) return null;

    const s = signal.structured_post;
    const engagementContext = getEngagementContext(s?.classification?.primary_category);

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
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h2 className="text-white font-black uppercase tracking-tighter text-xl">Signal Detail</h2>
                                {signal.is_synthetic && (
                                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px] font-black uppercase tracking-widest animate-pulse">
                                        DEMO MODE
                                    </span>
                                )}
                            </div>
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

                    {/* DEMO TELEMETRY CONSOLE */}
                    {signal.is_synthetic && (
                        <div className="bg-amber-950/20 p-6 rounded-2xl border border-amber-500/20 space-y-4">
                            <div className="flex items-center justify-between border-b border-amber-500/10 pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                    <h3 className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Synthetic Demo Console</h3>
                                </div>
                                <div className="flex flex-wrap gap-1.5 justify-end">
                                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded text-[9px] font-black uppercase tracking-tight">
                                        SYNTHETIC DATA
                                    </span>
                                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded text-[9px] font-black uppercase tracking-tight">
                                        DEMO MODE
                                    </span>
                                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded text-[9px] font-black uppercase tracking-tight">
                                        NOT LIVE DATA
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                                {/* Qualification State */}
                                <div>
                                    <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Qualification Visibility</span>
                                    <button
                                        onClick={() => {
                                            const states = ["Qualified", "Suppressed", "Review Required", "Compliance Review Required", "Follow-Up Required"];
                                            const next = states[(states.indexOf(qualificationState) + 1) % states.length];
                                            setQualificationState(next);
                                            signal.qualification_state = next;
                                        }}
                                        className={`px-3 py-1.5 rounded-lg border font-bold uppercase text-[10px] w-full text-left transition-all ${
                                            qualificationState === 'Qualified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            qualificationState === 'Suppressed' ? 'bg-slate-800 text-slate-500 border-slate-700/55 line-through' :
                                            qualificationState === 'Review Required' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            qualificationState === 'Compliance Review Required' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            'bg-pink-500/10 text-pink-400 border-pink-500/20'
                                        }`}
                                    >
                                        {qualificationState}
                                    </button>
                                </div>

                                {/* Review Visibility */}
                                <div>
                                    <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Review Visibility</span>
                                    <button
                                        onClick={() => {
                                            const states = ["Pending Review", "Reviewed", "Review Required"];
                                            const next = states[(states.indexOf(reviewState) + 1) % states.length];
                                            setReviewState(next);
                                            signal.review_state = next;
                                        }}
                                        className="px-3 py-1.5 rounded-lg border font-bold uppercase text-[10px] w-full text-left transition-all bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500"
                                    >
                                        {reviewState}
                                    </button>
                                </div>

                                {/* Human Approval Visibility */}
                                <div>
                                    <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Human Approval Status</span>
                                    <button
                                        onClick={() => {
                                            const states = ["Approval Required", "Approval Pending", "Approval Complete"];
                                            const next = states[(states.indexOf(approvalState) + 1) % states.length];
                                            setApprovalState(next);
                                            signal.approval_state = next;
                                        }}
                                        className={`px-3 py-1.5 rounded-lg border font-bold uppercase text-[10px] w-full text-left transition-all ${
                                            approvalState === 'Approval Complete' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            approvalState === 'Approval Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}
                                    >
                                        {approvalState}
                                    </button>
                                </div>

                                {/* Follow-Up Visibility */}
                                <div>
                                    <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Follow-Up State</span>
                                    <button
                                        onClick={() => {
                                            const states = ["Follow-Up Required", "Follow-Up Pending", "Follow-Up Complete"];
                                            const next = states[(states.indexOf(followupState) + 1) % states.length];
                                            setFollowupState(next);
                                            signal.followup_state = next;
                                        }}
                                        className={`px-3 py-1.5 rounded-lg border font-bold uppercase text-[10px] w-full text-left transition-all ${
                                            followupState === 'Follow-Up Complete' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            followupState === 'Follow-Up Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                                            'bg-pink-500/10 text-pink-400 border-pink-500/20'
                                        }`}
                                    >
                                        {followupState}
                                    </button>
                                </div>

                                {/* CTA Stage Selector (Advisory Only) */}
                                <div className="col-span-2 border-t border-amber-500/15 pt-3">
                                    <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">
                                        CTA Advisory Level Selector (Advisory Only)
                                    </span>
                                    <div className="flex gap-2">
                                        {["trust_only", "asset_positioning", "discovery_closing"].map((cta) => (
                                            <button
                                                key={cta}
                                                onClick={() => {
                                                    setDemoCta(cta);
                                                    signal.selected_cta = cta;
                                                }}
                                                className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all ${
                                                    demoCta === cta 
                                                    ? 'bg-amber-500 text-slate-950 font-black shadow-md border border-amber-450' 
                                                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                                                }`}
                                            >
                                                {cta.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                    <span className="text-[9px] text-amber-500/70 italic mt-1.5 block">
                                        ⚠️ Advisory only: No automatic CTA selection or autonomous engagement occurs.
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Classification & Score Grid */}
                    <div className="grid grid-cols-1 gap-6">
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-4 h-4 text-slate-500" />
                                <h3 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Classification Truth</h3>
                            </div>
                            <SignalClassificationBlock 
                                classification={{
                                    primary_category: s?.classification?.primary_category || 'UNCLASSIFIED',
                                    signal_type: s?.classification?.signal_type || 'unclassified',
                                    context_tags: s?.classification?.context_tags,
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

                    {/* Engagement Strategy Section (S11-T05) */}
                    <section>
                        <EngagementAnglePanel 
                            category={s?.classification.primary_category || 'UNCLASSIFIED'}
                            type={s?.classification.signal_type || 'unclassified'}
                        />
                    </section>

                    {/* Discussion Metadata Section */}
                    {s?.discussion_metadata && (
                        <section className="bg-indigo-950/20 p-6 rounded-2xl border border-indigo-500/20 space-y-4">
                            <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3">
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4 text-indigo-400 animate-pulse" />
                                    <h3 className="text-[10px] text-indigo-400 uppercase font-black tracking-widest">Discussion-Layer Payload</h3>
                                </div>
                                <span className="px-2 py-0.5 bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded text-[9px] font-black uppercase">
                                    {s.discussion_metadata.discussion_source_type} (depth {s.discussion_metadata.discussion_depth})
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">Author Handle</span>
                                    <span className="text-white font-mono font-medium">@{s.discussion_metadata.author_handle}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">Source Type</span>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                        s.discussion_metadata.source_type === 'help_seeker' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' :
                                        s.discussion_metadata.source_type === 'recommendation_seeker' ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30' :
                                        s.discussion_metadata.source_type === 'transition_seeker' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' :
                                        s.discussion_metadata.source_type === 'experience_sharer' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                                        s.discussion_metadata.source_type === 'creator_seller' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                                        'bg-slate-700/30 text-slate-400 border border-slate-600/30'
                                    }`}>
                                        {s.discussion_metadata.source_type.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">Qualification Reason</span>
                                    <p className="text-slate-300 italic">"{s.discussion_metadata.qualification_reason}"</p>
                                </div>
                                {s.discussion_metadata.matched_phrase && (
                                    <div className="col-span-2">
                                        <span className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">Explainability (Matched Phrase)</span>
                                        <span className="px-2 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded font-mono font-bold">
                                            Matched pattern: "{s.discussion_metadata.matched_phrase}"
                                        </span>
                                    </div>
                                )}
                                {s.discussion_metadata.parent_post_url && (
                                    <div className="col-span-2 border-t border-indigo-500/10 pt-3">
                                        <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Parent Post URL</span>
                                        <a 
                                            href={s.discussion_metadata.parent_post_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-indigo-400 font-bold hover:underline flex items-center gap-1 inline-flex text-xs break-all"
                                        >
                                            {s.discussion_metadata.parent_post_url} <Share2 className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Governance Context */}
                    <section className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-cyan-500" />
                                <h3 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Governance Queue</h3>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                s?.governance_route?.queue === 'demo_synthetic_queue'
                                ? 'bg-amber-500/15 text-amber-450 border-amber-500/35 animate-pulse font-black'
                                : 'bg-cyan-500/10 text-cyan-405 border-cyan-500/20'
                            }`}>
                                {s?.governance_route?.queue === 'demo_synthetic_queue' ? 'DEMO/SYNTHETIC QUEUE' : (s?.governance_route?.queue?.replace(/_/g, ' ') || 'GENERAL QUEUE')}
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

                    {/* Synthetic Data Disclaimer (S15-T01 Requirement) */}
                    {signal.is_synthetic && (
                        <div className="bg-slate-950/80 p-5 rounded-2xl border border-amber-500/20 text-slate-400 text-[11px] leading-relaxed">
                            <span className="text-amber-400 font-bold block mb-1">⚠️ SYSTEM SAFETY DISCLOSURE (MANDATORY):</span>
                            Synthetic Demo Mode does not represent: live-source data, live acquisition capability, source coverage capability, connector capability, or production-scale performance.
                        </div>
                    )}

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

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md flex flex-col gap-3">
                    <button 
                        onClick={() => setIsRespondOpen(true)}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Respond to Signal
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-2xl transition-all border border-slate-700"
                    >
                        Close Detail View
                    </button>
                </div>

                {/* Respond Workspace Overlay */}
                <RespondWorkspace 
                    isOpen={isRespondOpen}
                    onClose={() => setIsRespondOpen(false)}
                    signal={signal}
                    suggestedReply={engagementContext.replies[0]?.text || ''}
                    engagementAngle={engagementContext.primaryAngle}
                    engagementRationale={engagementContext.primaryRationale}
                />
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

