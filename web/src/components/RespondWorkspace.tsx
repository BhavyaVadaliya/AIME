import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Copy, ExternalLink, ShieldCheck, Target, Type, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { createExecutionPayload, validateExecutionPayload, stageExecutionPayload } from '../utils/executionEngine';
import { ExecutionValidationResult } from '../types/execution';
import { startExecutionSession, getSessionStatus, getActiveSessionIdentity, ExtensionResponse } from '../utils/extensionBridge';
import { ExecutionStatusBanner } from './ExecutionStatusBanner';
import { ActiveSessionIndicator } from './ActiveSessionIndicator';



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
    const [executionReady, setExecutionReady] = useState<ExecutionValidationResult | null>(null);
    const [isStaged, setIsStaged] = useState(false);
    const [extensionStatus, setExtensionStatus] = useState<string>('');
    const [extensionSessionId, setExtensionSessionId] = useState<string>('');
    const [extensionReason, setExtensionReason] = useState<string>('');
    const [accountStatus, setAccountStatus] = useState<'connected' | 'not_detected' | 'unavailable'>('unavailable');
    const [accountUsername, setAccountUsername] = useState<string>('');



    // Sync draft with suggested reply when signal changes or workspace opens
    useEffect(() => {
        setDraft(suggestedReply);
        setExecutionReady(null);
        setIsStaged(false);
        setExtensionStatus('');
        setExtensionSessionId('');
        setExtensionReason('');
        setAccountStatus('unavailable');
        setAccountUsername('');
    }, [suggestedReply, isOpen]);



    if (!isOpen || !signal) return null;

    const s = signal.structured_post;

    const handleCopy = () => {
        navigator.clipboard.writeText(draft);
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus('Copy Response'), 2000);
    };

    const handlePrepareExecution = async () => {
        if (!s) return;

        // S12-T04: Always use the current 'draft' text, not the original suggestion
        const payload = createExecutionPayload(
            signal.signal_id,
            s?.source?.platform?.toLowerCase() || 'tiktok',
            'comment_reply',
            s?.source?.source_url || '',
            draft, // Use current editor state
            s?.source?.author_id
        );

        const validation = validateExecutionPayload(payload);
        setExecutionReady(validation);

        if (validation.ok) {
            stageExecutionPayload(payload);
            setIsStaged(true);
            
            // S12-T02/T04 Extension Handoff
            const extResponse: ExtensionResponse = await startExecutionSession(payload);
            setExtensionStatus(extResponse.status);
            
            if (extResponse.session_id) {
                setExtensionSessionId(extResponse.session_id);
                
                // S12-T04: Poll for injection status
                const pollInterval = setInterval(async () => {
                    const statusUpdate = await getSessionStatus(extResponse.session_id!);
                    
                    // S12 UX: Also poll for active identity
                    const identityUpdate = await getActiveSessionIdentity(extResponse.session_id!);
                    if (identityUpdate) {
                        setAccountStatus(identityUpdate.status);
                        setAccountUsername(identityUpdate.username || '');
                    }

                    if (statusUpdate && statusUpdate.status !== extResponse.status) {

                        setExtensionStatus(statusUpdate.status);
                        if (statusUpdate.reason) setExtensionReason(statusUpdate.reason);
                        
                        // Stop polling if we reach a terminal state
                        if (['injection_succeeded', 'injection_failed', 'payload_expired'].includes(statusUpdate.status)) {
                            clearInterval(pollInterval);
                        }
                    }
                }, 1000);

                // Cleanup on component unmount
                setTimeout(() => clearInterval(pollInterval), 30000); // 30s timeout
            }
            
            if (extResponse.reason) setExtensionReason(extResponse.reason);
        }
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
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">S11-T06 Preparation Layer & S12-T01 Execution Bridge</p>
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

                        {/* Sprint 12 Execution Readiness Section */}
                        <section className="bg-slate-950/40 p-5 rounded-2xl border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-4">
                                <Zap className="w-3 h-3 text-amber-400" />
                                <h3 className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Execution Readiness</h3>
                            </div>
                            <div className="space-y-3">
                                <ReadinessItem label="Platform" status={s?.source?.platform?.toLowerCase() === 'tiktok' ? 'ok' : 'unsupported'} text={s?.source?.platform || 'unknown'} />
                                <ReadinessItem label="Action" status="ok" text="comment_reply" />
                                <ReadinessItem label="Source Link" status={s?.source?.source_url ? 'ok' : 'missing'} text={s?.source?.source_url ? 'Validated' : 'Missing'} />
                                <ReadinessItem label="Reply Text" status={draft.trim().length > 0 ? 'ok' : 'missing'} text={draft.trim().length > 0 ? 'Ready' : 'Required'} />
                                
                                {executionReady && (
                                    <div className={`mt-4 p-3 rounded-xl border flex items-start gap-2 ${
                                        executionReady.ok ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
                                    }`}>
                                        {executionReady.ok ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                        )}
                                        <div className="flex flex-col">
                                            <p className={`text-[11px] font-black uppercase ${executionReady.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {executionReady.ok ? 'Payload Staged' : 'Readiness Error'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 leading-tight">
                                                {executionReady.ok ? 'Execution preparation ready for Sprint 12. No action taken yet.' : `Reason: ${executionReady.reason}`}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <ExecutionStatusBanner 
                                    status={extensionStatus} 
                                    sessionId={extensionSessionId} 
                                    reason={extensionReason} 
                                />
                            </div>
                        </section>

                        {/* Onboarding Guidance */}
                        {extensionStatus === 'extension_unavailable' && (
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 mt-4">
                                <h4 className="text-[10px] font-black uppercase text-amber-500 mb-2">Bridge Setup Required</h4>
                                <ol className="text-[9px] text-slate-400 space-y-1 list-decimal ml-4">
                                    <li>Open chrome://extensions</li>
                                    <li>Enable Developer Mode</li>
                                    <li>Click "Load unpacked"</li>
                                    <li>Select the AIME /extension directory</li>
                                    <li>Ensure extension is enabled</li>
                                    <li>Log into TikTok in this profile</li>
                                </ol>
                            </div>
                        )}

                        <div className="bg-slate-800/20 p-5 rounded-2xl border border-slate-800 italic">
                            <p className="text-[10px] text-slate-500 leading-normal">
                                Advisory: Response prepared in AIME remains local. Use the copy button to transfer to the platform. Execution prep is advisory only.
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

                        {/* Active Session Indicator */}
                        <div className="flex justify-center mb-4">
                            <ActiveSessionIndicator status={accountStatus} username={accountUsername} />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4 pt-2">

                            <button
                                onClick={handlePrepareExecution}
                                className={`flex-1 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm py-5 rounded-2xl transition-all active:scale-[0.98] shadow-lg ${
                                    extensionStatus === 'injection_succeeded'
                                    ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
                                    : extensionStatus === 'extension_unavailable'
                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                                }`}
                                disabled={extensionStatus === 'extension_unavailable'}
                            >
                                <Zap className="w-5 h-5" />
                                {extensionStatus === 'injection_succeeded' 
                                    ? 'Draft Ready' 
                                    : extensionStatus === 'extension_unavailable'
                                    ? 'Extension Not Detected'
                                    : 'Open Source + Insert Draft'}
                            </button>



                            <button
                                onClick={handleCopy}
                                className={`flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm py-5 px-8 rounded-2xl transition-all border border-slate-700 active:scale-[0.98] ${
                                    copyStatus === 'Copied!' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                }`}
                            >
                                <Copy className="w-5 h-5" />
                                {copyStatus}
                            </button>
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

const ReadinessItem = ({ label, status, text }: { label: string, status: 'ok' | 'unsupported' | 'missing', text: string }) => (
    <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-500 font-bold">{label}</span>
        <div className="flex items-center gap-2">
            <span className={`font-mono ${status === 'ok' ? 'text-slate-300' : 'text-red-400 italic'}`}>{text}</span>
            {status === 'ok' ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            ) : (
                <AlertCircle className="w-3 h-3 text-red-400" />
            )}
        </div>
    </div>
);

