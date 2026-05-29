import { WorkflowPanelState } from '../types/workflow';

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates the current operator choices in the guided workflow panel state.
 */
export function validateWorkflowState(state: Partial<WorkflowPanelState>): WorkflowValidationResult {
  const errors: string[] = [];

  if (!state.signal_id) {
    errors.push('Missing target Signal ID reference.');
  }

  if (!state.qualification_confirmed) {
    errors.push('Please check the box to confirm you have reviewed and qualified this signal.');
  }

  if (!state.selected_cta_level) {
    errors.push('Please manually select a Call-to-Action (CTA) level.');
  }

  if (!state.selected_destination_asset) {
    errors.push('Please manually choose a destination asset.');
  }

  if (!state.final_action) {
    errors.push('Please select a final workspace action.');
  }

  if (state.engagement_state === 'follow_up_needed' && !state.operator_note?.trim()) {
    errors.push('An operator note is required when follow-up is requested.');
  }

  if (state.final_action === 'disqualify' && !state.operator_note?.trim()) {
    errors.push('An operator note stating the reason for disqualification is required.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
