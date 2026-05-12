import React from 'react';
import { Zap, CheckCircle2, AlertCircle, ExternalLink, Clock } from 'lucide-react';

interface Props {
    status: string;
    sessionId?: string;
    reason?: string;
}

export const ExecutionStatusBanner: React.FC<Props> = ({ status, sessionId, reason }) => {
    if (!status) return null;

    const getStatusConfig = () => {
        switch (status) {
            case 'tab_opened':
                return {
                    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500/20',
                    text: 'text-emerald-400',
                    title: 'Execution Session Active',
                    desc: 'Source tab opened and payload bound.'
                };
            case 'payload_invalid':
                return {
                    icon: <AlertCircle className="w-4 h-4 text-red-400" />,
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/20',
                    text: 'text-red-400',
                    title: 'Preparation Failed',
                    desc: `Reason: ${reason || 'Validation Error'}`
                };
            case 'payload_expired':
                return {
                    icon: <Clock className="w-4 h-4 text-amber-400" />,
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500/20',
                    text: 'text-amber-400',
                    title: 'Payload Expired',
                    desc: 'Session expired. Please re-stage or continue manually below.'
                };
            case 'injection_succeeded':
                return {
                    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500/20',
                    text: 'text-emerald-400',
                    title: 'Draft Injected',
                    desc: 'Draft inserted. Please review on TikTok before manually posting.'
                };
            case 'injection_failed':
                return {
                    icon: <AlertCircle className="w-4 h-4 text-red-400" />,
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/20',
                    text: 'text-red-400',
                    title: 'Injection Failed',
                    desc: reason || 'Draft insertion failed. Use manual copy/paste.'
                };
            case 'extension_unavailable':

                return {
                    icon: <Zap className="w-4 h-4 text-slate-400" />,
                    bg: 'bg-slate-500/10',
                    border: 'border-slate-500/20',
                    text: 'text-slate-400',
                    title: 'Extension Unavailable',
                    desc: 'Please ensure AIME Execution Bridge is installed.'
                };
            default:
                return {
                    icon: <Zap className="w-4 h-4 text-indigo-400" />,
                    bg: 'bg-indigo-500/10',
                    border: 'border-indigo-500/20',
                    text: 'text-indigo-400',
                    title: 'Status: ' + status,
                    desc: reason || 'Session update received.'
                };
        }
    };

    const config = getStatusConfig();

    return (
        <div className={`mt-4 p-4 rounded-2xl border ${config.bg} ${config.border} flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className="mt-0.5">{config.icon}</div>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <p className={`text-[11px] font-black uppercase ${config.text}`}>
                        {config.title}
                    </p>
                    {sessionId && (
                        <span className="text-[9px] text-slate-500 font-mono">
                            {sessionId.split('-').pop()}
                        </span>
                    )}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight mt-1">
                    {config.desc}
                </p>
            </div>
        </div>
    );
};
