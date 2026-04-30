import React from 'react';
import { Compass, Lightbulb } from 'lucide-react';

interface Props {
    angle: string;
    rationale: string;
    isPrimary?: boolean;
}

export const AngleRecommendationCard: React.FC<Props> = ({ angle, rationale, isPrimary }) => {
    return (
        <div className={`p-4 rounded-2xl border transition-all ${
            isPrimary 
            ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_-5px_rgba(99,102,241,0.3)]' 
            : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'
        }`}>
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-1.5 rounded-lg ${isPrimary ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-400'}`}>
                    {isPrimary ? <Compass className="w-3.5 h-3.5" /> : <Lightbulb className="w-3.5 h-3.5" />}
                </div>
                <h5 className={`text-[11px] font-black uppercase tracking-widest ${isPrimary ? 'text-indigo-300' : 'text-slate-400'}`}>
                    {isPrimary ? 'Primary Recommended Angle' : 'Alternate Strategy'}
                </h5>
            </div>
            
            <h4 className={`text-sm font-bold mb-1.5 ${isPrimary ? 'text-white' : 'text-slate-200'}`}>
                {angle}
            </h4>
            
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                {rationale}
            </p>
        </div>
    );
};
