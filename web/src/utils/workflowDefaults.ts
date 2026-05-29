import { CtaLevel, DestinationAsset } from '../types/workflow';

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
  if (normalizedTags.includes('multi_signal_exploration_boost') || normalizedTags.includes('commercial_intent_multi_signal_boost')) {
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
