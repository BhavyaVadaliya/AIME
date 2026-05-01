import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Copy, ExternalLink, ShieldCheck, Target, Type } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    signal: any;
    suggestedReply: string;
    engagementAngle: string;
    engagementRationale: string;
}

export const RespondWorkspace: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    signal, 
    suggestedReply, 
    engagementAngle, 
    engagementRationale 
}) => {
    const [draft, setDraft] = useState(suggestedReply);
    const [copyStatus, setCopyStatus] = useState('Copy Response');

    // Sync draft with suggested reply when signal changes or workspace opens
    useEffect(() => {
        setDraft(suggestedReply);
    }, [suggestedReply, isOpen]);

    if (!isOpen || !signal) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(draft);
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus('Copy Response'), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-700/50 w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/40">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl">
                            <MessageSquare className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-white text-xl font-black uppercase tracking-tight">Respond Workspace</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">S11-T06 Preparation Layer</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 flex flex-col lg:flex-row gap-8">
                    
                    {/* Left: Context Panel */}
                    <div className="lg:w-1/3 space-y-6">
                        <section className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                                <Target className="w-3 h-3" /> Signal Context
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Source</p>
                                    <a 
                                        href={signal.structured_post?.source?.source_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-indigo-400 text-sm font-bold hover:underline flex items-center gap-1"
                                    >
                                        @{signal.structured_post?.source?.username || 'unknown'} <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Classification</p>
                                    <span className="text-white text-sm font-medium">{signal.structured_post?.classification?.primary_category}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Priority</p>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                                        signal.structured_post?.priority_tier === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                                        signal.structured_post?.priority_tier === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-slate-700 text-slate-400'
                                    }`}>
                                        {signal.structured_post?.priority_tier}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section className="bg-indigo-500/5 p-5 rounded-2xl border border-indigo-500/20">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3" /> Engagement Strategy
                            </h3>
                            <p className="text-sm font-bold text-white mb-2">{engagementAngle}</p>
                            <p className="text-[11px] text-slate-400 leading-relaxed italic">
                                "{engagementRationale}"
                            </p>
                        </section>

                        <div className="bg-slate-800/20 p-5 rounded-2xl border border-slate-800 italic">
                            <p className="text-[10px] text-slate-500 leading-normal">
                                Advisory: Response prepared in AIME remains local. Use the copy button to transfer to the platform.
                            </p>
                        </div>
                    </div>

                    {/* Right: Response Editor */}
                    <div className="flex-1 flex flex-col gap-6">
                        <div className="flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <Type className="w-3 h-3" /> Response Draft (Editable)
                                </h3>
                                <span className="text-[10px] text-slate-600 font-mono">
                                    {draft.length} characters
                                </span>
                            </div>
                            
                            <textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                className="flex-1 w-full bg-slate-950/50 border-2 border-slate-700/50 focus:border-indigo-500/50 rounded-3xl p-6 text-white text-base leading-relaxed resize-none outline-none transition-all placeholder:text-slate-700"
                                placeholder="Write your response here..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4 pt-2">
                            <button
                                onClick={handleCopy}
                                className="flex-1 flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-sm py-5 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20"
                            >
                                <Copy className="w-5 h-5" />
                                {copyStatus}
                            </button>
                            <a
                                href={signal.structured_post?.source?.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black uppercase tracking-widest text-sm py-5 px-8 rounded-2xl transition-all"
                            >
                                <ExternalLink className="w-5 h-5" />
                                Open Source
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footer Status */}
                <div className="px-8 py-4 bg-slate-950/40 border-t border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Operator Control Mode Active</span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-medium italic">Prepared Response strictly for HITL review. No automation active.</span>
                </div>
            </div>
        </div>
    );
};
