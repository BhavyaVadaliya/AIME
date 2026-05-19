import * as fs from 'fs';
import * as path from 'path';

export type IntentCategory = 
  | 'priority_candidate' 
  | 'neutral_candidate' 
  | 'excluded_low_intent' 
  | 'seller_candidate' 
  | 'promoter_candidate' 
  | 'prospect_candidate';

export interface IntentRefinementResult {
  category: IntentCategory;
  matched_priority_pattern?: string;
  matched_exclusion_pattern?: string;
}

/**
 * Deterministic Intent Refinement Helper - S13-T01 Calibration.
 * Inspects raw text against configured phrase lists, seller contamination rules, and prospect preservation safeguards.
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

  // Deterministic S13-T01 Contamination Patterns
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

  const certificationSellerPatterns = [
    "become certified today",
    "start your coaching business",
    "launch your nutrition business"
  ];

  // Deterministic S13-T01 Prospect Preservation Safeguards
  const prospectPreservationPatterns = [
    "what certification should i take",
    "how do i become a dietitian",
    "i want a side income",
    "thinking of changing careers",
    "changing careers",
    "change careers",
    "side income",
    "career transition",
    "how to transition"
  ];

  const professionalKeywords = [
    "dietitian",
    "nutritionist",
    "registered dietitian",
    "rd",
    "rdn",
    "nurse",
    "rn",
    "clinician",
    "healthcare professional",
    "medical student",
    "dietetic intern",
    "nutrition student"
  ];

  const helperKeywords = [
    "become",
    "certification",
    "certified",
    "study",
    "course",
    "training",
    "career",
    "transition",
    "class"
  ];

  // Helper to check for pattern match
  const findMatch = (patterns: string[]) => patterns.find(p => t.includes(p.toLowerCase()));

  const matchedSeller = findMatch(sellerPatterns);
  const matchedCertSeller = findMatch(certificationSellerPatterns);
  const matchedPreservation = findMatch(prospectPreservationPatterns);

  // Check if it satisfies Mixed-Signal Protection (BOTH professional/monetization curiosity AND seller/promoter patterns)
  const hasSellerIndicator = !!matchedSeller || !!matchedCertSeller;
  
  // Subtract matched seller patterns from text to ensure professional keywords are independent
  let textWithoutSeller = t;
  if (matchedSeller) {
    textWithoutSeller = textWithoutSeller.replace(matchedSeller.toLowerCase(), '');
  }
  if (matchedCertSeller) {
    textWithoutSeller = textWithoutSeller.replace(matchedCertSeller.toLowerCase(), '');
  }

  const hasProfessionalCuriosity = professionalKeywords.some(kw => textWithoutSeller.includes(kw));
  const isMixedSignal = hasSellerIndicator && hasProfessionalCuriosity;

  // 1. Prospect Preservation Safeguard & Mixed-Signal Protection (Highest Precedence)
  if (matchedPreservation || isMixedSignal) {
    const reason = matchedPreservation ? "professional_transition_interest" : "mixed_intent_preservation";
    console.log(JSON.stringify({
      event: "prospect_signal_preserved",
      timestamp: new Date().toISOString(),
      signal_id: signalId,
      reason: reason,
      status: "ok"
    }));
    return { 
      category: 'prospect_candidate', 
      matched_priority_pattern: matchedPreservation || "mixed_intent_curiosity" 
    };
  }


  // 2. Pure Seller / Promoter Contamination Detection
  if (matchedSeller) {
    console.log(JSON.stringify({
      event: "seller_candidate_detected",
      timestamp: new Date().toISOString(),
      signal_id: signalId,
      matched_pattern: matchedSeller,
      status: "ok"
    }));
    return { category: 'seller_candidate', matched_exclusion_pattern: matchedSeller };
  }

  if (matchedCertSeller) {
    console.log(JSON.stringify({
      event: "seller_candidate_detected",
      timestamp: new Date().toISOString(),
      signal_id: signalId,
      matched_pattern: matchedCertSeller,
      status: "ok"
    }));
    return { category: 'promoter_candidate', matched_exclusion_pattern: matchedCertSeller };
  }

  // 3. Fallback to existing GIME Intent Refinement Flow
  const matchedPriority = findMatch(priorityPatterns);
  const matchedProfession = findMatch(professionPatterns);
  const matchedExclusion = findMatch(exclusionPatterns);

  // Priority Candidate (Direct)
  if (matchedPriority) {
    console.log(JSON.stringify({
      event: "signal_prioritized_intent",
      timestamp: new Date().toISOString(),
      signal_id: signalId,
      reason: "priority_phrase_match",
      matched_pattern: matchedPriority,
      status: "ok"
    }));
    return { category: 'priority_candidate', matched_priority_pattern: matchedPriority };
  }

  // Mixed-Signal Safeguard (Priority/Profession + Exclusion)
  if (matchedExclusion && matchedProfession) {
    console.log(JSON.stringify({
      event: "signal_retained_mixed_intent",
      timestamp: new Date().toISOString(),
      signal_id: signalId,
      low_intent_pattern: matchedExclusion,
      priority_pattern: matchedProfession,
      status: "ok"
    }));
    return { category: 'priority_candidate', matched_exclusion_pattern: matchedExclusion, matched_priority_pattern: matchedProfession };
  }

  // Excluded Low-Intent
  if (matchedExclusion && !matchedPriority && !matchedProfession) {
    console.log(JSON.stringify({
      event: "signal_excluded_low_intent",
      timestamp: new Date().toISOString(),
      signal_id: signalId,
      reason: "excluded_phrase_match",
      matched_pattern: matchedExclusion,
      status: "ok"
    }));
    return { category: 'excluded_low_intent', matched_exclusion_pattern: matchedExclusion };
  }

  // Neutral
  return { category: 'neutral_candidate' };
}

