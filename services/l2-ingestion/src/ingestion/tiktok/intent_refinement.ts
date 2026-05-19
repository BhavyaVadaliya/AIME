import * as fs from 'fs';
import * as path from 'path';

export type IntentCategory = 'priority_candidate' | 'neutral_candidate' | 'excluded_low_intent';

export interface IntentRefinementResult {
  category: IntentCategory;
  matched_priority_pattern?: string;
  matched_exclusion_pattern?: string;
  // Sprint 13 - Seller / Promoter Suppression
  seller_promoter_tag?: 'seller_candidate' | 'promoter_candidate' | 'prospect_candidate' | 'neutral_candidate';
  is_deprioritized?: boolean;
  deprioritization_reason?: string;
}

/**
 * Deterministic Intent Refinement Helper.
 * Inspects raw text against configured phrase lists and applies precedence rules.
 */
export function refineIntent(text: string, signalId: string): IntentRefinementResult {
  const t = text.toLowerCase();
  
  // Load config
  const configPath = path.resolve(__dirname, '..', '..', '..', '..', '..', 'config', 'ingestion', 'tiktok_scope.json');
  let config: any = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  const priorityPatterns: string[] = config.priority_phrase_patterns || [];
  const professionPatterns: string[] = config.target_profession_phrase_patterns || [];
  const exclusionPatterns: string[] = config.excluded_phrase_patterns || [];

  // Helper to check for pattern match
  const findMatch = (patterns: string[]) => patterns.find(p => t.includes(p.toLowerCase()));

  const matchedPriority = findMatch(priorityPatterns);
  const matchedProfession = findMatch(professionPatterns);
  const matchedExclusion = findMatch(exclusionPatterns);

  // Default output categories
  let category: IntentCategory = 'neutral_candidate';
  let seller_promoter_tag: 'seller_candidate' | 'promoter_candidate' | 'prospect_candidate' | 'neutral_candidate' = 'neutral_candidate';
  let is_deprioritized = false;
  let deprioritization_reason = '';

  // Category A — Seller / Funnel Indicators
  const sellerPatterns = [
    "link in bio",
    "dm me",
    "join my program",
    "my coaching program",
    "my mentorship",
    "enroll now",
    "limited spots",
    "sign up now",
    "apply now",
    "clients only",
    "my students",
    "book a call"
  ];

  // Category B — Certification Seller Signals
  const promoterPatterns = [
    "become certified today",
    "start your coaching business",
    "launch your nutrition business",
    "course selling",
    "credential funneling",
    "outbound certification promotion",
    "high-pressure educational sales"
  ];

  // Safeguards (CRITICAL)
  const prospectSafeguards = [
    "what certification should i take",
    "how do i become a dietitian",
    "i want a side income",
    "i’m thinking of changing careers",
    "i'm thinking of changing careers"
  ];

  const professionalKeywords = [
    "nurse",
    "dietitian",
    "nutritionist",
    "dietetic intern",
    "career change",
    "career transition",
    "clinical",
    "side income",
    "rd exam"
  ];

  const isSafeguardMatch = prospectSafeguards.some(p => t.includes(p));
  const hasProfessionalContext = professionalKeywords.some(p => t.includes(p));
  const hasSellerPattern = sellerPatterns.some(p => t.includes(p));
  const hasPromoterPattern = promoterPatterns.some(p => t.includes(p));

  if (isSafeguardMatch) {
    seller_promoter_tag = 'prospect_candidate';
    console.log(JSON.stringify({
      event: "prospect_signal_preserved",
      signal_id: signalId,
      reason: "prospect_safeguard_matched",
      status: "ok"
    }));
  } else if (hasProfessionalContext && (hasSellerPattern || hasPromoterPattern)) {
    seller_promoter_tag = 'prospect_candidate';
    console.log(JSON.stringify({
      event: "prospect_signal_preserved",
      signal_id: signalId,
      reason: "professional_transition_interest",
      status: "ok"
    }));
  } else if (hasSellerPattern) {
    seller_promoter_tag = 'seller_candidate';
    is_deprioritized = true;
    deprioritization_reason = "seller_contamination_pattern_matched";
    console.log(JSON.stringify({
      event: "seller_candidate_detected",
      signal_id: signalId,
      matched_pattern: sellerPatterns.find(p => t.includes(p)),
      status: "ok"
    }));
  } else if (hasPromoterPattern) {
    seller_promoter_tag = 'promoter_candidate';
    is_deprioritized = true;
    deprioritization_reason = "promoter_contamination_pattern_matched";
    console.log(JSON.stringify({
      event: "promoter_candidate_detected",
      signal_id: signalId,
      matched_pattern: promoterPatterns.find(p => t.includes(p)),
      status: "ok"
    }));
  } else if (matchedPriority || matchedProfession) {
    seller_promoter_tag = 'prospect_candidate';
  } else {
    seller_promoter_tag = 'neutral_candidate';
  }

  // Preserve the original refineIntent priority candidate logic
  // 1. Priority Candidate (Direct)
  if (matchedPriority) {
    category = 'priority_candidate';
    console.log(JSON.stringify({
      event: "signal_prioritized_intent",
      timestamp: new Date().toISOString(),
      signal_id: signalId,
      reason: "priority_phrase_match",
      matched_pattern: matchedPriority,
      status: "ok"
    }));
  }

  // 2. Mixed-Signal Safeguard (Priority/Profession + Exclusion)
  else if (matchedExclusion && matchedProfession) {
    category = 'priority_candidate';
    console.log(JSON.stringify({
      event: "signal_retained_mixed_intent",
      timestamp: new Date().toISOString(),
      signal_id: signalId,
      low_intent_pattern: matchedExclusion,
      priority_pattern: matchedProfession,
      status: "ok"
    }));
  }

  // 3. Excluded Low-Intent
  else if (matchedExclusion && !matchedPriority && !matchedProfession) {
    category = 'excluded_low_intent';
    console.log(JSON.stringify({
      event: "signal_excluded_low_intent",
      timestamp: new Date().toISOString(),
      signal_id: signalId,
      reason: "excluded_phrase_match",
      matched_pattern: matchedExclusion,
      status: "ok"
    }));
  }

  // 4. Neutral
  else {
    category = 'neutral_candidate';
  }

  return {
    category,
    matched_priority_pattern: matchedPriority,
    matched_exclusion_pattern: matchedExclusion,
    seller_promoter_tag,
    is_deprioritized,
    deprioritization_reason
  };
}
