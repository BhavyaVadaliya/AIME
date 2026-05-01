import React from 'react';
import { MessageSquare, Sparkles, Send } from 'lucide-react';
import { ReplyVariationCard } from './ReplyVariationCard';
import { CtaDirectionHint } from './CtaDirectionHint';

import { getEngagementContext } from '../utils/engagementLogic';

interface Props {
    category: string;
    type: string;
    rawText: string;
}

export const SuggestedReplyPanel: React.FC<Props> = ({ category, type, rawText }) => {
    const suggestions = getEngagementContext(category);


    return (
        <div className="bg-slate-900/40 rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl">
            {/* Panel Header */}
            <div className="bg-slate-800/60 p-5 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-xl">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-black uppercase tracking-tight text-base">Operator Assistant</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">S11-T04 Suggested Engagement</p>
                    </div>
                </div>
                <CtaDirectionHint direction={suggestions.direction} />
            </div>

            <div className="p-6 space-y-6">
                {/* Public Reply Variations */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                        <h4 className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Suggested Public Replies</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {suggestions.replies.map((reply, idx) => (
                            <ReplyVariationCard 
                                key={idx} 
                                label={reply.label} 
                                variation={reply.text} 
                            />
                        ))}
                    </div>
                </div>

                {/* Optional Outreach Opener */}
                <div className="space-y-4 pt-4 border-t border-slate-800/50">
                    <div className="flex items-center gap-2 mb-1">
                        <Send className="w-3.5 h-3.5 text-slate-500" />
                        <h4 className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Suggested Outreach / DM Opener</h4>
                    </div>
                    <ReplyVariationCard 
                        label="Direct Message Draft" 
                        variation={suggestions.outreach} 
                    />
                </div>

                {/* Disclaimer */}
                <div className="pt-2">
                    <p className="text-[9px] text-slate-600 italic text-center">
                        Suggestions are advisory only. No automated execution is enabled for this signal.
                    </p>
                </div>
            </div>
        </div>
    );
};
