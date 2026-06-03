import React from 'react';
import { EngagementState } from '../../types/workflow';
import { FileText, Save } from 'lucide-react';

interface Props {
  engagementState: EngagementState;
  followUpRequired: boolean;
  operatorNote: string;
  isSaving: boolean;
  onEngagementStateChange: (state: EngagementState) => void;
  onFollowUpRequiredChange: (checked: boolean) => void;
  onOperatorNoteChange: (note: string) => void;
  onSave: () => void;
}

export const ContinuityNoteBox: React.FC<Props> = ({
  engagementState,
  followUpRequired,
  operatorNote,
  isSaving,
  onEngagementStateChange,
  onFollowUpRequiredChange,
  onOperatorNoteChange,
  onSave
}) => {
  const stateOptions: { value: EngagementState; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'needs_response', label: 'Needs Response' },
    { value: 'response_drafted', label: 'Response Drafted' },
    { value: 'waiting', label: 'Waiting' },
    { value: 'follow_up_needed', label: 'Follow-Up Needed' },
    { value: 'not_fit', label: 'Not Fit' },
    { value: 'closed', label: 'Closed' }
  ];

  return (
    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-white text-base font-black uppercase tracking-tight">Step 5: Record Continuity Notes</h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Capture audit notes, follow-up requirements, and sync state</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Engagement State Selector */}
        <div className="space-y-2">
          <label htmlFor="engagement-state-dropdown" className="text-xs font-bold text-slate-400">
            Engagement State (Required)
          </label>
          <select
            id="engagement-state-dropdown"
            value={engagementState}
            onChange={(e) => onEngagementStateChange(e.target.value as EngagementState)}
            className="w-full bg-slate-950 border-2 border-slate-800 focus:border-indigo-500/50 text-white rounded-xl p-3 text-sm outline-none transition-all cursor-pointer font-bold"
          >
            {stateOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Follow up toggle */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-200">Follow-up Required</span>
            <span className="text-[10px] text-slate-500">Requires subsequent operator action</span>
          </div>
          <input
            type="checkbox"
            checked={followUpRequired}
            onChange={(e) => onFollowUpRequiredChange(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/50 border-slate-700 bg-slate-900 accent-indigo-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Operator Note Textarea */}
      <div className="space-y-2">
        <label htmlFor="operator-note-textarea" className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          Operator Note & Context Details
        </label>
        <textarea
          id="operator-note-textarea"
          value={operatorNote}
          onChange={(e) => onOperatorNoteChange(e.target.value)}
          placeholder="Record details about the interaction, reason for disqualification, or specific instructions for follow-up..."
          className="w-full h-24 bg-slate-950 border-2 border-slate-800 focus:border-indigo-500/50 text-white rounded-xl p-4 text-xs leading-relaxed resize-none outline-none transition-all placeholder:text-slate-700"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        disabled={isSaving}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer"
      >
        <Save className="w-5 h-5" />
        {isSaving ? 'Saving Continuity Metadata...' : 'Save & Persist Continuity'}
      </button>
    </div>
  );
};
