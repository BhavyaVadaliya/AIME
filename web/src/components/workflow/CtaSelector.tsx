import React from 'react';
import { CtaLevel } from '../../types/workflow';
import { AlertCircle } from 'lucide-react';

interface Props {
  selectedCta: CtaLevel;
  suggestedCta: CtaLevel;
  suggestionReason: string;
  onChange: (cta: CtaLevel) => void;
}

export const CtaSelector: React.FC<Props> = ({
  selectedCta,
  suggestedCta,
  suggestionReason,
  onChange
}) => {
  const ctaOptions: { value: CtaLevel; label: string; description: string }[] = [
    { value: 'trust_only', label: 'Trust-only', description: 'Establish pure baseline rapport without outbound link attachments.' },
    { value: 'educational_cta', label: 'Educational CTA', description: 'Provide helpful, value-first insights explaining scope-of-practice.' },
    { value: 'resource_cta', label: 'Resource CTA', description: 'Offer a complimentary tool, spreadsheet, or checklist for validation.' },
    { value: 'conversation_cta', label: 'Conversation CTA', description: 'Ask curious, personal questions to invite direct message replies.' },
    { value: 'course_awareness_cta', label: 'Course-awareness CTA', description: 'Highlight training curricula or pathway information.' },
    { value: 'enrollment_cta', label: 'Enrollment CTA', description: 'Present enrollment details or pathway onboarding pathways.' }
  ];

  return (
    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-white text-base font-black uppercase tracking-tight">Step 2: Select Call-to-Action (CTA) Level</h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Determine the depth of the engagement outreach response</p>
      </div>

      {/* Advisory suggestion block */}
      <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10 flex gap-3">
        <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest block">AIME Advisory Suggestion</span>
          <p className="text-[11px] text-slate-300 font-bold">
            Suggested Depth: <span className="text-white capitalize">"{suggestedCta.replace(/_/g, ' ')}"</span>
          </p>
          <p className="text-[10px] text-slate-400 leading-normal italic">
            "{suggestionReason}"
          </p>
        </div>
      </div>

      {/* Selector Dropdown Grid */}
      <div className="space-y-3">
        <label htmlFor="cta-level-dropdown" className="text-xs font-bold text-slate-400">
          Manual Operator Selection (Required)
        </label>
        <select
          id="cta-level-dropdown"
          value={selectedCta}
          onChange={(e) => onChange(e.target.value as CtaLevel)}
          className="w-full bg-slate-950 border-2 border-slate-800 focus:border-indigo-500/50 text-white rounded-xl p-3 text-sm outline-none transition-all cursor-pointer font-bold capitalize"
        >
          {ctaOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label} {option.value === suggestedCta ? ' (Suggested)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Option Description */}
      {selectedCta && (
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/50">
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-1">CTA Impact Description</span>
          <p className="text-xs text-slate-400 leading-normal">
            {ctaOptions.find(o => o.value === selectedCta)?.description}
          </p>
        </div>
      )}
    </div>
  );
};
