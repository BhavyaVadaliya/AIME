import React from 'react';

interface ScoreProps {
    score: number;
    category_weight?: number;
    type_adjustment?: number;
    pattern_boost?: number;
}

export const SignalScoreBreakdown: React.FC<{ scoreData: ScoreProps }> = ({ scoreData }) => {
    return (
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex justify-between items-end mb-4">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Total Intelligence Score</span>
                <span className="text-3xl font-mono font-black text-cyan-400">{scoreData.score}</span>
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Category Weight</span>
                    <span className="font-mono text-slate-200">+{scoreData.category_weight ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Type Adjustment</span>
                    <span className="font-mono text-slate-200">+{scoreData.type_adjustment ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Pattern Boost</span>
                    <span className="font-mono text-emerald-400">+{scoreData.pattern_boost ?? 0}</span>
                </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-800 text-[10px] text-slate-500 italic">
                * Scores are calculated deterministically based on discovery rules.
            </div>
        </div>
    );
};
