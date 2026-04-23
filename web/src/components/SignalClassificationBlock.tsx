import React from 'react';
import { Tag, Hash } from 'lucide-react';

interface ClassificationProps {
    primary_category: string;
    signal_type: string;
    context_tags?: string[];
    mapCategoryLabel: (c: string) => string;
}

export const SignalClassificationBlock: React.FC<{ classification: ClassificationProps }> = ({ classification }) => {
    const mappedLabel = classification.mapCategoryLabel(classification.primary_category);
    const hasMapping = mappedLabel.toUpperCase() !== classification.primary_category.toUpperCase();

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/30">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Primary Category</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-white uppercase tracking-tighter">{mappedLabel}</span>
                        {hasMapping && (
                            <span className="text-[9px] text-slate-600 font-mono">({classification.primary_category})</span>
                        )}
                    </div>
                </div>
                
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/30">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Signal Type</span>
                    <span className="text-sm font-semibold text-slate-200 uppercase">{classification.signal_type.replace(/_/g, ' ')}</span>
                </div>
            </div>

            {classification.context_tags && classification.context_tags.length > 0 && (
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/30">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Context Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {classification.context_tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded border border-slate-700">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
