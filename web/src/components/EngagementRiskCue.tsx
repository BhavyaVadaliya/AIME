import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

interface Props {
    risk: string;
}

export const EngagementRiskCue: React.FC<Props> = ({ risk }) => {
    return (
        <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1">
                    Strategy Risk Cue
                </span>
                <p className="text-[11px] text-amber-200/80 font-medium leading-tight italic">
                    "{risk}"
                </p>
            </div>
        </div>
    );
};
