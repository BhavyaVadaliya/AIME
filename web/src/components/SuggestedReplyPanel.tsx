import React from 'react';
import { MessageSquare, Sparkles, Send } from 'lucide-react';
import { ReplyVariationCard } from './ReplyVariationCard';
import { CtaDirectionHint } from './CtaDirectionHint';

interface Props {
    category: string;
    type: string;
    rawText: string;
}

export const SuggestedReplyPanel: React.FC<Props> = ({ category, type, rawText }) => {
    // Deterministic Suggestion Logic (Local/Presentation side only)
    const getSuggestions = () => {
        const cat = category.toUpperCase();
        
        if (cat.includes('MONETIZATION')) {
            return {
                direction: "Qualify Intent & ROI",
                replies: [
                    { label: "Value-First", text: "Many start exactly where you are. Have you looked into the ROI for this specific path?" },
                    { label: "Curiosity", text: "Thinking about taking the leap? What's your biggest question about the investment?" }
                ],
                outreach: "Curious what path you're exploring in nutrition. Would love to hear your goals."
            };
        }

        if (cat.includes('PROFESSIONAL_PATHWAY') || cat.includes('CAREER')) {
            return {
                direction: "Offer Guidance / Roadmap",
                replies: [
                    { label: "Empathy", text: "The journey to becoming a clinician is rewarding. What part of the process are you in?" },
                    { label: "Assistance", text: "I've seen many navigate this transition. Happy to share what the first steps usually look like." }
                ],
                outreach: "Noticed you're looking into the RD path. Happy to connect if you have questions!"
            };
        }

        if (cat.includes('EDUCATION')) {
            return {
                direction: "Educate & Inform",
                replies: [
                    { label: "Science-Oriented", text: "Evidence-based knowledge is key. Have you seen our curriculum breakdown?" },
                    { label: "Curiosity", text: "Learning the science is step one. What specific area of nutrition interests you most?" }
                ],
                outreach: "Curiosity is the best start. Are you looking for a formal certification?"
            };
        }

        // Fallback / General
        return {
            direction: "Open Conversation",
            replies: [
                { label: "Engagement", text: "Interesting perspective! How did you first get interested in this topic?" },
                { label: "Value", text: "Thanks for sharing this! Would love to hear more about your thoughts on it." }
            ],
            outreach: "Love your content! Curious to hear more about your nutrition journey."
        };
    };

    const suggestions = getSuggestions();

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
