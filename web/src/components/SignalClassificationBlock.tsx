import React from 'react';
import { Tag } from 'lucide-react';

interface ClassificationProps {
    primary_category: string;
    signal_type: string;
    context_tags?: string[];
    seller_promoter_tag?: string;
    is_deprioritized?: boolean;
    deprioritization_reason?: string;
    mapCategoryLabel?: (c: string) => string;
}

export const SignalClassificationBlock: React.FC<{ classification: ClassificationProps }> = ({ classification }) => {
    const primaryCat = classification?.primary_category || 'UNCLASSIFIED';
    const mappedLabel = classification?.mapCategoryLabel ? classification.mapCategoryLabel(primaryCat) : primaryCat;
    const hasMapping = mappedLabel.toUpperCase() !== primaryCat.toUpperCase();

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/30">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Primary Category</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-white uppercase tracking-tighter">{mappedLabel}</span>
                        {hasMapping && (
                            <span className="text-[9px] text-slate-600 font-mono">({primaryCat})</span>
                        )}
                    </div>
                </div>
                
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/30">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Signal Type</span>
                    <span className="text-sm font-semibold text-slate-200 uppercase">{(classification?.signal_type || 'unclassified').replace(/_/g, ' ')}</span>
                </div>
            </div>

            {classification.seller_promoter_tag && (
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/30">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2">Contamination Calibration</span>
                    <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
                            classification.seller_promoter_tag === 'seller_candidate' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            classification.seller_promoter_tag === 'promoter_candidate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            classification.seller_promoter_tag === 'prospect_candidate' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                            {classification.seller_promoter_tag.replace(/_/g, ' ')}
                        </span>
                        {classification.is_deprioritized && (
                            <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest bg-red-500/5 px-2 py-1 rounded border border-red-500/10">
                                Deprioritized
                            </span>
                        )}
                    </div>
                    {classification.deprioritization_reason && (
                        <p className="text-[9px] text-slate-500 mt-2 font-mono">Basis: {classification.deprioritization_reason.replace(/_/g, ' ')}</p>
                    )}
                </div>
            )}

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
