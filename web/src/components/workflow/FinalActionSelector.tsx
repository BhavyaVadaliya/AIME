import React from 'react';
import { FinalAction } from '../../types/workflow';
import { Play, Copy, ExternalLink, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Props {
  selectedAction: FinalAction;
  extensionStatus: string;
  onChange: (action: FinalAction) => void;
  onTriggerAction: (action: FinalAction) => void;
}

export const FinalActionSelector: React.FC<Props> = ({
  selectedAction,
  extensionStatus,
  onChange,
  onTriggerAction
}) => {
  const isExtensionUnavailable = extensionStatus === 'extension_unavailable';

  const actionOptions: { value: FinalAction; label: string; description: string }[] = [
    { value: 'save_for_later', label: 'Save for later', description: 'Stash this signal in the operator workspace queue without taking public actions.' },
    { value: 'respond_manually', label: 'Respond manually', description: 'Proceed to manually interact with the TikTok poster outside the execution flow.' },
    { value: 'copy_response', label: 'Copy response', description: 'Copy the prepared response draft text directly into your system clipboard.' },
    { value: 'open_source_post', label: 'Open source post', description: 'Open the original TikTok video link in a new browser tab for visual context.' },
    { value: 'insert_draft', label: 'Insert draft', description: 'Leverage the AIME Chrome Extension bridge to load the post and inject the draft comment.' },
    { value: 'mark_follow_up', label: 'Mark follow-up', description: 'Set a pending reminder flag requiring supervisor review or subagent follow-up.' },
    { value: 'disqualify', label: 'Disqualify', description: 'Mark the post as a non-relevant signal, moving it safely out of active queues.' }
  ];

  return (
    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-white text-base font-black uppercase tracking-tight">Step 4: Select Final Action</h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Determine and trigger the manual workspace execution outcome</p>
      </div>

      {/* Extension/Handshake Status Indicators */}
      {isExtensionUnavailable ? (
        <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest block">Manual Fallback Mode Active</span>
            <p className="text-[10px] text-slate-400 leading-normal">
              The AIME Execution Bridge Chrome Extension is currently unavailable. **Insert Draft** is safely disabled to prevent pipeline errors. Copy Response and Open Source Post actions remain fully functional in fallback mode.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest block">AIME Extension Bridge Connected</span>
            <p className="text-[10px] text-slate-400 leading-normal">
              Chrome Extension handshake verified. Ready for automatic TikTok tab load and draft injection support.
            </p>
          </div>
        </div>
      )}

      {/* Select Action Dropdown */}
      <div className="space-y-3">
        <label htmlFor="final-action-dropdown" className="text-xs font-bold text-slate-400">
          Action Choice (Required)
        </label>
        <select
          id="final-action-dropdown"
          value={selectedAction}
          onChange={(e) => onChange(e.target.value as FinalAction)}
          className="w-full bg-slate-950 border-2 border-slate-800 focus:border-indigo-500/50 text-white rounded-xl p-3 text-sm outline-none transition-all cursor-pointer font-bold capitalize"
        >
          {actionOptions.map(option => {
            const isDisabled = option.value === 'insert_draft' && isExtensionUnavailable;
            return (
              <option key={option.value} value={option.value} disabled={isDisabled}>
                {option.label} {isDisabled ? ' (Disabled — Extension Setup Required)' : ''}
              </option>
            );
          })}
        </select>
      </div>

      {/* Execute Button */}
      {selectedAction && (
        <div className="space-y-4 pt-2">
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/50">
            <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-1">Action Description</span>
            <p className="text-xs text-slate-400 leading-normal">
              {actionOptions.find(o => o.value === selectedAction)?.description}
            </p>
          </div>

          <button
            onClick={() => onTriggerAction(selectedAction)}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {selectedAction === 'copy_response' ? (
              <Copy className="w-4 h-4" />
            ) : selectedAction === 'open_source_post' ? (
              <ExternalLink className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Trigger Action: {actionOptions.find(o => o.value === selectedAction)?.label}
          </button>
        </div>
      )}
    </div>
  );
};
