import React from 'react';
import { UserCircle2, ShieldAlert, ShieldCheck, Shield } from 'lucide-react';

interface Props {
    status: 'connected' | 'not_detected' | 'unavailable';
    username?: string;
}

export const ActiveSessionIndicator: React.FC<Props> = ({ status, username }) => {
    const getConfig = () => {
        switch (status) {
            case 'connected':
                return {
                    icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
                    text: `Connected as ${username}`,
                    color: 'text-emerald-400',
                    bg: 'bg-emerald-500/10'
                };
            case 'not_detected':
                return {
                    icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />,
                    text: 'TikTok session: Not detected',
                    color: 'text-amber-400',
                    bg: 'bg-amber-500/10'
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
