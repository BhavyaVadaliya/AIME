import React from 'react';
import { Target, HelpCircle } from 'lucide-react';
import { AngleRecommendationCard } from './AngleRecommendationCard';
import { EngagementRiskCue } from './EngagementRiskCue';
import { getEngagementContext } from '../utils/engagementLogic';

interface Props {
    category: string;
    type: string;
}

export const EngagementAnglePanel: React.FC<Props> = ({ category, type }) => {
    const strategy = getEngagementContext(category);

    return (
        <div className="bg-slate-900/40 rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl">
            {/* Panel Header */}
            <div className="bg-slate-800/60 p-5 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                        <Target className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-black uppercase tracking-tight text-base">Engagement Strategy</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">S11-T05 Posture Guidance</p>
                    </div>
                </div>
                <div className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors cursor-help group relative">
                    <HelpCircle className="w-4 h-4 text-slate-500" />
                    <div className="absolute right-0 top-full mt-2 w-48 p-3 bg-slate-800 border border-slate-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-2xl">
                        <p className="text-[10px] text-slate-300 leading-normal">
                            Strategy guidance helps choose the right 'posture' for the engagement based on signal context.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-5">
                {/* Primary Recommendation */}
                <AngleRecommendationCard 
                    isPrimary 
                    angle={strategy.primaryAngle} 
                    rationale={strategy.primaryRationale} 
                />

                {/* Alternates */}
                <div className="grid grid-cols-1 gap-4">
                    {strategy.alternates.map((alt, idx) => (
                        <AngleRecommendationCard 
                            key={idx}
                            angle={alt.angle} 
                            rationale={alt.rationale} 
                        />
                    ))}
                </div>

                {/* Risk Cue */}
                <EngagementRiskCue risk={strategy.risk} />

                {/* Alignment Note */}
                <p className="text-[9px] text-slate-600 italic text-center pt-2">
                    Strategy alignment verified: Suggested replies in the panel above are optimized for this posture.
                </p>
            </div>
        </div>
    );
};
