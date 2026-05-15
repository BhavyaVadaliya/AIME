import React from 'react';
import { UserCircle2, ShieldAlert, ShieldCheck, Shield } from 'lucide-react';

interface Props {
    status: 'connected' | 'not_detected' | 'unavailable' | 'no_tab' | 'script_not_attached';
    username?: string;
}

export const ActiveSessionIndicator: React.FC<Props> = ({ status, username }) => {
    const getConfig = () => {
        switch (status) {
            case 'connected':
                return {
                    icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
                    text: `Extension Connected: ${username}`,
                    color: 'text-emerald-400',
                    bg: 'bg-emerald-500/10'
                };
            case 'not_detected':
                return {
                    icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />,
                    text: 'Account not detected',
                    color: 'text-amber-400',
                    bg: 'bg-amber-500/10'
                };
            case 'no_tab':
                return {
                    icon: <Shield className="w-3.5 h-3.5 text-slate-500" />,
                    text: 'Waiting for TikTok Session',
                    color: 'text-slate-500',
                    bg: 'bg-slate-500/5'
                };

            case 'script_not_attached':
                return {
                    icon: <Shield className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />,
                    text: 'Attaching adapter...',
                    color: 'text-indigo-400',
                    bg: 'bg-indigo-500/10'
                };
            default:

                return {
                    icon: <Shield className="w-3.5 h-3.5 text-slate-500" />,
                    text: 'TikTok session unavailable',
                    color: 'text-slate-500',
                    bg: 'bg-slate-500/5'
                };
        }
    };

    const config = getConfig();

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 ${config.bg} transition-all duration-300`}>
            {config.icon}
            <span className={`text-[10px] font-black uppercase tracking-wider ${config.color}`}>
                {config.text}
            </span>
        </div>
    );
};
