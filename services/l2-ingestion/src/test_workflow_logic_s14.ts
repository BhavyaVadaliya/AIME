// Standalone self-contained logic check for Sprint 14 Guided Workflow Panel MVP Skeleton

export type CtaLevel =
  | "trust_only"
  | "educational_cta"
  | "resource_cta"
  | "conversation_cta"
  | "course_awareness_cta"
  | "enrollment_cta";

export type DestinationAsset =
  | "course_overview_page"
  | "gime_landing_page"
  | "confidence_checklist"
  | "scope_safe_explainer"
  | "faq_assets"
  | "no_asset";

export type FinalAction =
  | "save_for_later"
  | "respond_manually"
  | "copy_response"
  | "open_source_post"
  | "insert_draft"
  | "mark_follow_up"
  | "disqualify";

export type EngagementState =
  | "new"
  | "reviewed"
  | "engaged"
  | "follow_up_needed"
  | "closed"
  | "disqualified";

export interface WorkflowPanelState {
  signal_id: string;
  qualification_confirmed: boolean;
  selected_cta_level: CtaLevel;
  selected_destination_asset: DestinationAsset;
  final_action: FinalAction;
  engagement_state: EngagementState;
  last_action?: string;
  follow_up_required: boolean;
  operator_note?: string;
  updated_at: string;
}

export interface WorkflowSuggestion {
  ctaLevel: CtaLevel;
  destinationAsset: DestinationAsset;
  reason: string;
}

/**
 * Deterministically suggests a CTA level and asset based on signal properties.
 * This is an advisory recommendation only; operators must manually select.
 */
export function getWorkflowSuggestion(tags: string[], category: string): WorkflowSuggestion {
  const normalizedTags = (tags || []).map(t => t.toLowerCase());
  const normalizedCat = (category || '').toLowerCase();

  // Multi-Signal / High Value transitions
  if (normalizedTags.includes('multi_signal_exploration_boost') || normalizedTags.includes('commercial_intent_multi_signal_boost') || normalizedTags.includes('multi_signal_boost')) {
    return {
      ctaLevel: 'course_awareness_cta',
      destinationAsset: 'course_overview_page',
      reason: 'Highly qualified multi-signal candidate exploring career transitions; suggested Course Awareness CTA to present monetization pathway.'
    };
  }

  // Help-seeking / Transition
  if (normalizedTags.includes('help_seeking_candidate') || normalizedTags.includes('transition_candidate')) {
    return {
      ctaLevel: 'resource_cta',
      destinationAsset: 'confidence_checklist',
      reason: 'Help-seeking personal user facing shifts or transitions; suggested Resource CTA with the Confidence Checklist.'
    };
  }

  // Recommendation-seeking / Explanatory curiosity
  if (normalizedTags.includes('recommendation_seeking_candidate') || normalizedTags.includes('exploratory_curiosity')) {
    return {
      ctaLevel: 'educational_cta',
      destinationAsset: 'scope_safe_explainer',
      reason: 'User seeking guidance/recommendations; suggested Educational CTA with the Scope-Safe Explainer.'
    };
  }

  // Standard Commercial Intent Candidate
  if (normalizedCat === 'monetization' || normalizedTags.includes('commercial_intent_candidate')) {
    return {
      ctaLevel: 'conversation_cta',
      destinationAsset: 'gime_landing_page',
      reason: 'Identified commercial intent; suggested Conversation CTA pointing to the GIME Landing Page to trigger professional exploration.'
    };
  }

  // Default Fallback
  return {
    ctaLevel: 'trust_only',
    destinationAsset: 'no_asset',
    reason: 'Standard signal; suggested Trust-only CTA to establish initial advisory baseline with no asset attached.'
  };
}

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

async function runWorkflowLogicTests() {
  console.log("==========================================================");
  console.log("    AIME S14 MVP GUIDED WORKFLOW SKELETON LOGIC TESTS    ");
  console.log("==========================================================");

  let failedTests = 0;

  // Test Case 1: getWorkflowSuggestion for Multi-Signal Boost
  console.log("\nTesting Suggestion for Multi-Signal Boost...");
  const sugg1 = getWorkflowSuggestion(['multi_signal_exploration_boost'], 'Monetization');
  console.log(`Suggested CTA: ${sugg1.ctaLevel}`);
  console.log(`Suggested Asset: ${sugg1.destinationAsset}`);
  if (sugg1.ctaLevel === 'course_awareness_cta' && sugg1.destinationAsset === 'course_overview_page') {
    console.log("✅ Suggestion Test 1 PASS");
  } else {
    console.log("❌ Suggestion Test 1 FAIL");
    failedTests++;
  }

  // Test Case 2: getWorkflowSuggestion for Help Seeking / Transition
  console.log("\nTesting Suggestion for Help Seeking...");
  const sugg2 = getWorkflowSuggestion(['help_seeking_candidate'], 'Monetization');
  console.log(`Suggested CTA: ${sugg2.ctaLevel}`);
  console.log(`Suggested Asset: ${sugg2.destinationAsset}`);
  if (sugg2.ctaLevel === 'resource_cta' && sugg2.destinationAsset === 'confidence_checklist') {
    console.log("✅ Suggestion Test 2 PASS");
  } else {
    console.log("❌ Suggestion Test 2 FAIL");
    failedTests++;
  }

  // Test Case 3: validateWorkflowState for empty state
  console.log("\nTesting Validation for Empty State...");
  const val1 = validateWorkflowState({});
  console.log(`isValid: ${val1.isValid}`);
  console.log(`Errors: ${val1.errors.join(', ')}`);
  if (!val1.isValid && val1.errors.length >= 5) {
    console.log("✅ Validation Test 1 PASS");
  } else {
    console.log("❌ Validation Test 1 FAIL");
    failedTests++;
  }

  // Test Case 4: validateWorkflowState for valid state
  console.log("\nTesting Validation for Fully Populated Valid State...");
  const validState: Partial<WorkflowPanelState> = {
    signal_id: 'sig-test-123',
    qualification_confirmed: true,
    selected_cta_level: 'resource_cta',
    selected_destination_asset: 'confidence_checklist',
    final_action: 'copy_response',
    engagement_state: 'reviewed',
    follow_up_required: false,
    operator_note: 'Review completed manually.'
  };
  const val2 = validateWorkflowState(validState);
  console.log(`isValid: ${val2.isValid}`);
  if (val2.isValid) {
    console.log("✅ Validation Test 2 PASS");
  } else {
    console.log("❌ Validation Test 2 FAIL");
    failedTests++;
  }

  // Test Case 5: validateWorkflowState for disqualify without note
  console.log("\nTesting Validation for Disqualify without Note...");
  const invalidDisqualifyState: Partial<WorkflowPanelState> = {
    signal_id: 'sig-test-123',
    qualification_confirmed: true,
    selected_cta_level: 'trust_only',
    selected_destination_asset: 'no_asset',
    final_action: 'disqualify',
    engagement_state: 'closed',
    follow_up_required: false,
    operator_note: '' // Empty note
  };
  const val3 = validateWorkflowState(invalidDisqualifyState);
  console.log(`isValid: ${val3.isValid}`);
  if (!val3.isValid && val3.errors.includes('An operator note stating the reason for disqualification is required.')) {
    console.log("✅ Validation Test 3 PASS");
  } else {
    console.log("❌ Validation Test 3 FAIL");
    failedTests++;
  }

  console.log("\n==========================================================");
  if (failedTests === 0) {
    console.log("🎉 ALL S14 LOGIC TESTS PASSED SUCCESSFULLY!");
  } else {
    console.log(`💥 ${failedTests} LOGIC TESTS FAILED.`);
    process.exit(1);
  }
  console.log("==========================================================");
}

runWorkflowLogicTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
