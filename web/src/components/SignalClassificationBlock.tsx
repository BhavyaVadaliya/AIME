import React from 'react';
import { Tag, Hash } from 'lucide-react';

interface ClassificationProps {
    primary_category: string;
    signal_type: string;
    context_tags?: string[];
    mapCategoryLabel: (c: string) => string;
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


            {classification.context_tags && classification.context_tags.length > 0 && (
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/30">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Context Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {classification.context_tags.map(tag => {
                            let styles = 'bg-slate-800 text-slate-400 border-slate-700';
                            if (tag === 'prospect_candidate') {
                                styles = 'bg-pink-500/10 text-pink-400 border-pink-500/30 font-bold';
                            } else if (tag === 'multi_signal_boost') {
                                styles = 'bg-amber-500/15 text-amber-300 border-amber-400/40 font-black tracking-wider animate-pulse';
                            } else if (tag === 'commercial_intent_candidate' || tag === 'personal_exploration_candidate' || tag === 'help_seeking_candidate' || tag === 'transition_candidate' || tag === 'recommendation_seeking_candidate') {
                                styles = 'bg-sky-500/10 text-sky-400 border-sky-500/30 font-bold';
                            } else if (tag === 'commercial_intent_multi_signal_boost' || tag === 'multi_signal_exploration_boost') {
                                styles = 'bg-amber-500/15 text-amber-300 border-amber-400/40 font-black tracking-wider animate-pulse';
                            } else if (tag === 'self_referential_intent') {
                                styles = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
                            } else if (tag === 'frustration_language') {
                                styles = 'bg-red-500/10 text-red-300 border-red-500/30';
                            } else if (tag === 'recommendation_seeking') {
                                styles = 'bg-teal-500/10 text-teal-300 border-teal-500/30';
                            } else if (tag === 'help_seeking') {
                                styles = 'bg-violet-500/10 text-violet-300 border-violet-500/30';
                            } else if (tag === 'career_transition_language' || tag === 'career_transition_intent') {
                                styles = 'bg-orange-500/10 text-orange-300 border-orange-500/30';
                            } else if (tag === 'exploratory_curiosity') {
                                styles = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
                            } else if (tag === 'professional_identity_match') {
                                styles = 'bg-violet-500/10 text-violet-300 border-violet-500/30';
                            } else if (tag === 'side_income_intent') {
                                styles = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
                            } else if (tag === 'certification_interest') {
                                styles = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
                            } else if (tag === 'clinical_advancement_intent') {
                                styles = 'bg-blue-500/10 text-blue-300 border-blue-500/30';
                            } else if (tag === 'seller_candidate' || tag === 'promoter_candidate' || tag === 'creator_marketing_candidate' || tag === 'commercial_seller_suppressed' || tag === 'creator_candidate' || tag === 'outbound_marketing_candidate' || tag === 'audience_builder_candidate' || tag === 'coaching_promotion_candidate') {
                                styles = 'bg-slate-955/60 text-slate-600 border-slate-800/80 line-through opacity-60';
                            }
                            return (
                                <span key={tag} className={`px-2 py-0.5 text-[10px] rounded border transition-all hover:scale-105 duration-200 ${styles}`}>
                                    #{tag}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
