import { CtaLevel, DestinationAsset } from '../types/workflow';

export interface WorkflowSuggestion {
  ctaLevel: CtaLevel;
  destinationAsset: DestinationAsset;
  reason: string;
}

/**
 * Deterministically suggests a GIME CTA level and asset based on signal properties.
 * This is an advisory recommendation only; operators must manually select.
 */
export function getWorkflowSuggestion(tags: string[], category: string): WorkflowSuggestion {
  const normalizedTags = (tags || []).map(t => t.toLowerCase());
  const normalizedCat = (category || '').toLowerCase();

  // 1. Nurse / Strong Fit
  if (normalizedTags.includes('gime_nurse_fit')) {
    return {
      ctaLevel: 'course_awareness_cta',
      destinationAsset: 'course_description',
      reason: 'Strong fit healthcare professional (Nurse). Recommended Course-awareness CTA paired with Course Description as the safest first monetization asset.'
    };
  }

  // 2. Chiropractor / Strong Fit
  if (normalizedTags.includes('gime_chiro_fit')) {
    return {
      ctaLevel: 'course_awareness_cta',
      destinationAsset: 'course_description',
      reason: 'Strong fit healthcare professional (Chiropractor). Suggested Course-awareness CTA with Course Description to support patient conversations.'
    };
  }

  // 3. Burned-Out Healthcare Professional
  if (normalizedTags.includes('gime_burnout_fit')) {
    return {
      ctaLevel: 'educational_cta',
      destinationAsset: 'scope_safe_explainer',
      reason: 'Healthcare professional expressing burnout or transition curiosity. Suggested Educational CTA with Scope-Safe Explainer to guide transition.'
    };
  }

  // 4. Side-Income Curious Professional
  if (normalizedTags.includes('gime_sideincome_fit')) {
    return {
      ctaLevel: 'course_awareness_cta',
      destinationAsset: 'course_description',
      reason: 'Healthcare professional exploring side income options. Recommended Course-awareness CTA with Course Description.'
    };
  }

  // 5. Certification Recommendation Seeker
  if (normalizedTags.includes('gime_certseeker_fit')) {
    return {
      ctaLevel: 'course_awareness_cta',
      destinationAsset: 'course_description',
      reason: 'User explicitly asking for certification recommendations. Mapped to Course-awareness CTA with Course Description.'
    };
  }

  // 6. Supplement Seller (Not Fit)
  if (normalizedTags.includes('gime_seller_fit') || normalizedTags.includes('commercial_seller_suppressed')) {
    return {
      ctaLevel: 'trust_only',
      destinationAsset: 'no_asset',
      reason: 'Suppressed supplement seller or promotional profile. Suppress / No CTA recommended (Trust-only, no asset attached).'
    };
  }

  // 7. Compliance-Risk Signal
  if (normalizedTags.includes('gime_compliance_fit') || normalizedTags.includes('compliance_risk') || normalizedTags.includes('compliance_risk_candidate')) {
    return {
      ctaLevel: 'trust_only',
      destinationAsset: 'no_asset',
      reason: 'Compliance-risk detected (exaggerated income or treatment claims). No enrollment CTA / Human review required.'
    };
  }

  // Multi-Signal / High Value transitions fallback
  if (normalizedTags.includes('multi_signal_exploration_boost') || normalizedTags.includes('commercial_intent_multi_signal_boost')) {
    return {
      ctaLevel: 'course_awareness_cta',
      destinationAsset: 'course_description',
      reason: 'Highly qualified multi-signal candidate exploring career transitions; suggested Course-awareness CTA with Course Description.'
    };
  }

  // Help-seeking / Transition fallback
  if (normalizedTags.includes('help_seeking_candidate') || normalizedTags.includes('transition_candidate')) {
    return {
      ctaLevel: 'resource_cta',
      destinationAsset: 'confidence_checklist',
      reason: 'Help-seeking personal user facing shifts or transitions; suggested Resource CTA with the Confidence Checklist.'
    };
  }

  // Recommendation-seeking / Explanatory curiosity fallback
  if (normalizedTags.includes('recommendation_seeking_candidate') || normalizedTags.includes('exploratory_curiosity')) {
    return {
      ctaLevel: 'educational_cta',
      destinationAsset: 'scope_safe_explainer',
      reason: 'User seeking guidance/recommendations; suggested Educational CTA with the Scope-Safe Explainer.'
    };
  }

  // Standard Commercial Intent Candidate fallback
  if (normalizedCat === 'monetization' || normalizedTags.includes('commercial_intent_candidate')) {
    return {
      ctaLevel: 'conversation_cta',
      destinationAsset: 'gime_landing_page',
      reason: 'Identified commercial intent; suggested Conversation CTA pointing to the GIME Landing Page.'
    };
  }

  // Default Fallback
  return {
    ctaLevel: 'trust_only',
    destinationAsset: 'no_asset',
    reason: 'Standard signal; suggested Trust-only CTA with no asset attached.'
  };
}
