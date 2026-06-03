import React, { useState, useEffect } from 'react';
import { WorkflowProgressIndicator } from './WorkflowProgressIndicator';
import { SignalReviewBlock } from './SignalReviewBlock';
import { CtaSelector } from './CtaSelector';
import { DestinationAssetSelector } from './DestinationAssetSelector';
import { FinalActionSelector } from './FinalActionSelector';
import { ContinuityNoteBox } from './ContinuityNoteBox';
import { WorkflowPanelState, CtaLevel, DestinationAsset, FinalAction, EngagementState } from '../../types/workflow';
import { getWorkflowSuggestion } from '../../utils/workflowDefaults';
import { validateWorkflowState } from '../../utils/workflowValidation';
import { ArrowLeft, ArrowRight, ShieldCheck, ChevronRight, ShieldAlert, Layers } from 'lucide-react';

interface Props {
  signal: any;
  draftResponse: string;
  extensionStatus: string;
  onTriggerExecution: () => void;
  onCopyResponse: () => void;
  onOpenPost: () => void;
  onClose: () => void;
}

export const GuidedWorkflowPanel: React.FC<Props> = ({
  signal,
  draftResponse,
  extensionStatus,
  onTriggerExecution,
  onCopyResponse,
  onOpenPost,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // State elements
  const [qualificationConfirmed, setQualificationConfirmed] = useState(false);
  const [selectedCta, setSelectedCta] = useState<CtaLevel>('trust_only');
  const [selectedAsset, setSelectedAsset] = useState<DestinationAsset>('no_asset');
  const [selectedAction, setSelectedAction] = useState<FinalAction>('save_for_later');
  const [engagementState, setEngagementState] = useState<EngagementState>('new');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [operatorNote, setOperatorNote] = useState('');

  const s = signal?.structured_post;
  const tags = s?.classification?.context_tags || [];
  const category = s?.classification?.primary_category || '';

  // Get Suggestions
  const suggestion = getWorkflowSuggestion(tags, category);

  // Sync suggestion defaults
  useEffect(() => {
    if (signal) {
      // Set suggestions as initial selections
      setSelectedCta(suggestion.ctaLevel);
      setSelectedAsset(suggestion.destinationAsset);
      
      // Load pre-existing workflow metadata if database contains it
      const existing = s?.workflow_continuity;
      if (existing) {
        setQualificationConfirmed(existing.qualification_confirmed ?? false);
        setSelectedCta(existing.selected_cta_level ?? suggestion.ctaLevel);
        setSelectedAsset(existing.selected_destination_asset ?? suggestion.destinationAsset);
        setSelectedAction(existing.final_action ?? 'save_for_later');
        setEngagementState(existing.engagement_state ?? 'new');
        setFollowUpRequired(existing.follow_up_required ?? false);
        setOperatorNote(existing.operator_note ?? '');
      } else {
        // Reset state for new signal
        setQualificationConfirmed(false);
        setSelectedAction('save_for_later');
        setEngagementState('new');
        setFollowUpRequired(false);
        setOperatorNote('');
      }
      
      setCurrentStep(1);
      setSaveSuccess(false);
      setValidationErrors([]);
    }
  }, [signal]);

  const steps = [
    'Review Context',
    'CTA Selector',
    'Destination Asset',
    'Final Action',
    'Save Notes'
  ];

  const handleNextStep = () => {
    // Stage validations
    if (currentStep === 1 && !qualificationConfirmed) {
      setValidationErrors(['Please check the box to confirm you have reviewed the signal context.']);
      return;
    }

    setValidationErrors([]);
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setValidationErrors([]);
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleTriggerAction = (action: FinalAction) => {
    // Update local state action trace
    if (action === 'copy_response') {
      onCopyResponse();
    } else if (action === 'open_source_post') {
      onOpenPost();
    } else if (action === 'insert_draft') {
      onTriggerExecution();
    }
    
    // Automatically transition metadata values where helpful
    if (action === 'insert_draft' || action === 'copy_response' || action === 'respond_manually') {
      setEngagementState('response_drafted');
    } else if (action === 'mark_follow_up') {
      setEngagementState('follow_up_needed');
      setFollowUpRequired(true);
    } else if (action === 'disqualify') {
      setEngagementState('not_fit');
    }
  };

  const handleSaveContinuity = async () => {
    const statePayload: Partial<WorkflowPanelState> = {
      signal_id: signal.signal_id,
      qualification_confirmed: qualificationConfirmed,
      selected_cta_level: selectedCta,
      selected_destination_asset: selectedAsset,
      final_action: selectedAction,
      engagement_state: engagementState,
      follow_up_required: followUpRequired,
      operator_note: operatorNote,
      last_action: selectedAction,
      updated_at: new Date().toISOString()
    };

    const validation = validateWorkflowState(statePayload);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);
    setIsSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 
                    (window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://aime-0vwz.onrender.com');
      
      const response = await fetch(`${apiUrl}/admin/governance/signals/${signal.signal_id}/continuity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(statePayload)
      });

      if (response.ok) {
        setSaveSuccess(true);
        setIsSaving(false);
        // Refresh local memory properties
        if (signal.structured_post) {
          signal.structured_post.workflow_continuity = statePayload;
        }
        
        setTimeout(() => {
          setSaveSuccess(false);
          onClose(); // Automatically exit workflow Workspace view
        }, 2000);
      } else {
        throw new Error('Server returned persistence error');
      }
    } catch (err) {
      console.error(err);
      setValidationErrors(['Database persistence failed. Verify server local routing remains active.']);
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Visual Stepper */}
      <WorkflowProgressIndicator
        currentStep={currentStep}
        totalSteps={5}
        steps={steps}
        onStepClick={(step) => {
          // Prevent skipping steps without qualifying first
          if (!qualificationConfirmed && step > 1) {
            setValidationErrors(['Please review context and confirm qualification first.']);
            return;
          }
          setValidationErrors([]);
          setCurrentStep(step);
        }}
      />

      {/* S15-T02 Demo-Safe Warning Ribbon */}
      {signal.is_synthetic && (
        <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-amber-300 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
            <span>SYNTHETIC DATA | DEMO MODE</span>
          </div>
          <span>NOT LIVE DATA</span>
        </div>
      )}

      {/* GIME OPERATOR WORKFLOW PATH VISUALIZER (S15-T02) */}
      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            Active GIME Monetization Path
          </span>
          <span className="text-[9px] bg-slate-900 px-2 py-0.5 rounded text-indigo-400 border border-indigo-500/10 font-bold uppercase tracking-tight">
            HITL Active
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
          {/* 1. Signal */}
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-600 uppercase font-extrabold">Signal</span>
            <span className="text-white font-medium">@{signal.structured_post?.source?.username || 'unknown'}</span>
          </div>
          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />

          {/* 2. Review */}
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-600 uppercase font-extrabold">Review</span>
            <span className={qualificationConfirmed ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold animate-pulse'}>
              {qualificationConfirmed ? 'Qualified' : 'Unqualified'}
            </span>
          </div>
          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />

          {/* 3. CTA */}
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-600 uppercase font-extrabold">CTA</span>
            <span className="text-white capitalize">{selectedCta.replace(/_/g, ' ')}</span>
          </div>
          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />

          {/* 4. Asset */}
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-600 uppercase font-extrabold">Asset</span>
            <span className={selectedAsset === 'no_asset' ? 'text-slate-500 line-through' : 'text-indigo-400 font-bold'}>
              {selectedAsset.replace(/_/g, ' ')}
            </span>
          </div>
          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />

          {/* 5. Action */}
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-600 uppercase font-extrabold">Action</span>
            <span className="text-white capitalize">{selectedAction.replace(/_/g, ' ')}</span>
          </div>
          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />

          {/* 6. Follow-Up */}
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-600 uppercase font-extrabold">Follow-Up</span>
            <span className="text-slate-300 font-medium capitalize">
              {engagementState === 'follow_up_needed' ? 'Follow-Up Needed' : engagementState.replace(/_/g, ' ')}
            </span>
          </div>
          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />

          {/* 7. Human Approval */}
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-600 uppercase font-extrabold">Approval</span>
            <span className={`font-bold ${
              signal.approval_state === 'Approval Complete' ? 'text-emerald-400' :
              signal.approval_state === 'Approval Pending' ? 'text-amber-400' : 'text-slate-400'
            }`}>
              {signal.approval_state || 'Approval Required'}
            </span>
          </div>
        </div>
      </div>

      {/* validation Errors banner */}
      {validationErrors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-red-400 font-black uppercase tracking-widest block">Action Blocked</span>
          <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc ml-4">
            {validationErrors.map(err => <li key={err}>{err}</li>)}
          </ul>
        </div>
      )}

      {/* Success banner */}
      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400 animate-bounce" />
          <div className="flex flex-col">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">Sync Successful</span>
            <span className="text-[10px] text-slate-400">Continuity metadata safely persisted to the database. AIME queues synched.</span>
          </div>
        </div>
      )}

      {/* Wizard Panels */}
      <div className="flex-1 min-h-[300px]">
        {currentStep === 1 && (
          <SignalReviewBlock
            signal={signal}
            qualificationConfirmed={qualificationConfirmed}
            onConfirmChange={setQualificationConfirmed}
          />
        )}

        {currentStep === 2 && (
          <CtaSelector
            selectedCta={selectedCta}
            suggestedCta={suggestion.ctaLevel}
            suggestionReason={suggestion.reason}
            onChange={setSelectedCta}
          />
        )}

        {currentStep === 3 && (
          <DestinationAssetSelector
            selectedAsset={selectedAsset}
            suggestedAsset={suggestion.destinationAsset}
            onChange={setSelectedAsset}
          />
        )}

        {currentStep === 4 && (
          <FinalActionSelector
            selectedAction={selectedAction}
            extensionStatus={extensionStatus}
            onChange={setSelectedAction}
            onTriggerAction={handleTriggerAction}
          />
        )}

        {currentStep === 5 && (
          <ContinuityNoteBox
            engagementState={engagementState}
            followUpRequired={followUpRequired}
            operatorNote={operatorNote}
            isSaving={isSaving}
            onEngagementStateChange={setEngagementState}
            onFollowUpRequiredChange={setFollowUpRequired}
            onOperatorNoteChange={setOperatorNote}
            onSave={handleSaveContinuity}
          />
        )}
      </div>

      {/* Stepper Wizard Controls */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
        <button
          onClick={handlePrevStep}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-bold rounded-xl transition-all active:scale-[0.98] select-none text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>

        <button
          onClick={currentStep === 5 ? handleSaveContinuity : handleNextStep}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all active:scale-[0.98] select-none shadow-md shadow-indigo-500/10"
        >
          {currentStep === 5 ? 'Finish & Save' : 'Next'} <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
