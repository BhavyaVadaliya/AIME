import React from 'react';
import { Shield, Users, Compass, AlertCircle } from 'lucide-react';

interface Props {
  signal: any;
  qualificationConfirmed: boolean;
  onConfirmChange: (checked: boolean) => void;
}

export const SignalReviewBlock: React.FC<Props> = ({
  signal,
  qualificationConfirmed,
  onConfirmChange
}) => {
  if (!signal) return null;
  const s = signal.structured_post;

  const tags = s?.classification?.context_tags || [];
  const isProspect = tags.includes('prospect_candidate');
  const isMultiSignalBoost = tags.includes('multi_signal_exploration_boost') || tags.includes('commercial_intent_multi_signal_boost') || tags.includes('multi_signal_boost');
  const isPersonalExploration = tags.includes('personal_exploration_candidate') || tags.includes('help_seeking_candidate') || tags.includes('transition_candidate') || tags.includes('recommendation_seeking_candidate') || tags.includes('commercial_intent_candidate');
  const isCreatorSuppressed = tags.includes('commercial_seller_suppressed') || tags.includes('creator_candidate') || tags.includes('seller_candidate');

  return (
    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header & Source Preview */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-white text-base font-black uppercase tracking-tight">Step 1: Review Signal Context</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Validate raw text, source, and classification truth</p>
        </div>
        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
          s?.priority_tier === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
          s?.priority_tier === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }`}>
          {s?.priority_tier || 'LOW'} PRIORITY
        </span>
      </div>

      {/* Raw Content Box */}
      <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl">
        <p className="text-sm text-slate-300 leading-relaxed font-mono">
          "{s?.raw_text}"
        </p>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-900/50 text-[10px] text-slate-500">
          <span className="font-bold">Creator Handle: <span className="text-indigo-400">@{s?.source?.username || 'unknown'}</span></span>
          <span>Source URL: <a href={s?.source?.source_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Open Tab</a></span>
        </div>
      </div>

      {/* 2. Explainability & Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Signal Classification Indicators */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3">
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-2 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            Classification Truth
          </span>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Primary Category:</span>
              <span className="text-white font-bold uppercase tracking-tight">{s?.classification?.primary_category || 'UNCLASSIFIED'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Signal Type:</span>
              <span className="text-slate-300 capitalize">{s?.classification?.signal_type || 'Comment'}</span>
            </div>
          </div>
        </div>

        {/* Intent Qualifiers */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3">
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            Telemetry Quality State
          </span>
          <div className="flex flex-wrap gap-1.5">
            {isMultiSignalBoost && (
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[9px] font-black uppercase tracking-wider rounded animate-pulse">
                Multi-Signal Boost
              </span>
            )}
            {isPersonalExploration && (
              <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[9px] font-bold uppercase tracking-wider rounded">
                Personal Exploration
              </span>
            )}
            {isCreatorSuppressed && (
              <span className="px-2 py-0.5 bg-slate-950/80 text-slate-500 border border-slate-850 text-[9px] font-bold uppercase tracking-wider rounded line-through opacity-70">
                Suppressed Creator
              </span>
            )}
            {isProspect && (
              <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[9px] font-bold uppercase tracking-wider rounded">
                Prospect
              </span>
            )}
            {!isMultiSignalBoost && !isPersonalExploration && !isCreatorSuppressed && (
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[9px] font-bold uppercase tracking-wider rounded">
                Neutral Candidate
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Operator Confirmation Checkbox */}
      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/50 flex items-start gap-3">
        <input 
          id="qualification-confirmed-checkbox"
          type="checkbox"
          checked={qualificationConfirmed}
          onChange={(e) => onConfirmChange(e.target.checked)}
          className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/50 border-slate-700 bg-slate-900 accent-indigo-600 cursor-pointer"
        />
        <div className="flex flex-col">
          <label htmlFor="qualification-confirmed-checkbox" className="text-xs font-bold text-slate-200 cursor-pointer select-none">
            I confirm that I have reviewed the source data and qualified this signal.
          </label>
          <span className="text-[10px] text-slate-500 mt-1 leading-normal">
            Verifying the signal ensures that subsequent CTA and asset selections map strictly to authentic human intent before proceeding.
          </span>
        </div>
      </div>
    </div>
  );
};
