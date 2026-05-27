import * as fs from 'fs';
import * as path from 'path';

export type IntentCategory = 
  | 'priority_candidate' 
  | 'neutral_candidate' 
  | 'excluded_low_intent' 
  | 'seller_candidate' 
  | 'promoter_candidate' 
  | 'prospect_candidate'
  | 'commercial_intent_candidate'
  | 'creator_marketing_candidate';

export interface IntentRefinementResult {
  category: IntentCategory;
  matched_priority_pattern?: string;
  matched_exclusion_pattern?: string;
  matched_tags?: string[];
}

/**
 * Deterministic Intent Refinement Helper - S13-T02 & S13-T08 Calibration.
 * Inspects raw text against configured phrase lists, seller contamination rules, and prospect preservation safeguards.
 */
export function refineIntent(text: string, signalId: string): IntentRefinementResult {
  const t = text.toLowerCase().replace(/’/g, "'");
  
  // Word boundary pattern matcher to prevent false positive short word matches (like 'rn' in 'burned')
  const matchPattern = (textStr: string, pattern: string): boolean => {
    if (pattern.length <= 3) {
      const regex = new RegExp(`\\b${pattern}s?\\b`, 'i');
      return regex.test(textStr);
    }
    return textStr.includes(pattern);
  };

  // --- S13-T08 Dictionaries ---
  const creatorDicts: Record<string, string[]> = {
    funnel_promotion: ["link in bio", "book a call", "join my course", "join my program", "apply now", "reserve your spot", "enroll now", "sign up now"],
    audience_building: ["follow for more", "my students", "my clients", "my mentorship", "my coaching program", "my course", "my offer"],
    authority_broadcasting: ["i teach people how to", "i help nurses build", "my proven system", "my framework", "my methodology"],
    outbound_cta: ["dm me", "message me", "comment info", "comment guide", "send me a dm", "tap the link", "bio link"]
  };

  const personalDicts: Record<string, string[]> = {
    self_referential: ["i'm thinking about", "i am thinking about", "i'm considering", "i am considering", "i'm trying to", "i am trying to", "i'm looking for", "i am looking for", "i want to"],
    uncertainty_guidance: ["not sure where to start", "what should i do", "need advice", "looking for advice", "wondering if", "can someone help"],
    transition_burnout: ["burned out", "burnt out", "need a change", "leave bedside", "leaving bedside", "career transition", "alternative career", "switch careers"],
    recommendation_seeking: ["any recommendations", "what worked for you", "does anyone recommend", "recommend a course", "recommend a certification"],
    curiosity_exploration: ["thinking about", "considering", "looking into", "curious about", "exploring options", "is it worth it"]
  };

  // STEP 1: Source-type qualification
  const matchedCreatorPatterns: { category: string; pattern: string }[] = [];
  for (const [catName, phrases] of Object.entries(creatorDicts)) {
    for (const phrase of phrases) {
      if (matchPattern(t, phrase)) {
        matchedCreatorPatterns.push({ category: catName, pattern: phrase });
      }
    }
  }

  const matchedPersonalPatterns: { category: string; pattern: string }[] = [];
  for (const [catName, phrases] of Object.entries(personalDicts)) {
    for (const phrase of phrases) {
      if (matchPattern(t, phrase)) {
        matchedPersonalPatterns.push({ category: catName, pattern: phrase });
      }
    }
  }

  // Telemetry Step 1
  if (matchedCreatorPatterns.length > 0) {
    console.log(JSON.stringify({
      event: "creator_source_detected",
      matched_pattern: matchedCreatorPatterns[0].pattern,
      status: "ok"
    }));
  }

  if (matchedPersonalPatterns.length > 0) {
    console.log(JSON.stringify({
      event: "personal_exploration_detected",
      matched_pattern: matchedPersonalPatterns[0].pattern,
      status: "ok"
    }));
  }

  // STEP 2 & STEP 5: Creator/seller suppression & Visibility calibration
  const isCreatorDominated = matchedCreatorPatterns.length > 0 && matchedPersonalPatterns.length === 0;

  if (isCreatorDominated) {
    console.log(JSON.stringify({
      event: "creator_source_suppressed",
      reason: "outbound_marketing_dominance",
      status: "ok"
    }));

    const supTags = [
      "creator_candidate",
      "seller_candidate",
      "outbound_marketing_candidate",
      "audience_builder_candidate",
      "coaching_promotion_candidate",
      "commercial_seller_suppressed"
    ];

    return {
      category: 'creator_marketing_candidate',
      matched_exclusion_pattern: matchedCreatorPatterns[0].pattern,
      matched_tags: supTags
    };
  }

  // STEP 3 & STEP 4: Mixed intent override, personal elevation, and commercial intent refinement
  const hasMixedIntent = matchedCreatorPatterns.length > 0 && matchedPersonalPatterns.length > 0;
  if (hasMixedIntent) {
    console.log(JSON.stringify({
      event: "source_type_conflict_resolved",
      resolution: "personal_exploration_preserved",
      status: "ok"
    }));
  }

  const hasPersonalExploration = matchedPersonalPatterns.length > 0;
  if (hasPersonalExploration) {
    const matchedCategories = new Set(matchedPersonalPatterns.map(p => p.category));
    const isMultiSignal = matchedCategories.size >= 2;

    const elevationTags = [
      "personal_exploration_candidate",
      "help_seeking_candidate",
      "transition_candidate",
      "recommendation_seeking_candidate",
      "commercial_intent_candidate"
    ];

    if (isMultiSignal) {
      elevationTags.push("multi_signal_exploration_boost");
      console.log(JSON.stringify({
        event: "multi_signal_exploration_boost_applied",
        priority_floor: "HIGH",
        status: "ok"
      }));
    } else {
      console.log(JSON.stringify({
        event: "personal_user_elevated",
        priority_floor: "MEDIUM",
        status: "ok"
      }));
    }

    return {
      category: 'commercial_intent_candidate',
      matched_priority_pattern: matchedPersonalPatterns[0].pattern,
      matched_tags: elevationTags
    };
  }

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

  // Deterministic S13-T02 Category Dictionaries
  const categoryA_patterns = [
    "registered nurse", "nutrition student", "dietetic intern", "healthcare professional", "wellness practitioner",
    "massage therapist", "personal trainer", "health coach", "physiotherapist", "chiropractor", "dietitian", "nurse", "rn", "rd", "rd2be", "doctor"
  ];

  const categoryB_patterns = [
    "career transition", "new career path", "switch careers", "want something different", "leaving clinical", "leaving bedside",
    "advance my career", "professional growth", "career change", "burned out", "burnout"
  ];

  const categoryC_patterns = [
    "monetize my knowledge", "paid nutrition coaching", "nutrition business", "coaching income", "additional revenue",
    "side income", "extra income", "make money", "earn more", "add income", "coaching revenue", "nutrition coaching revenue"
  ];

  const categoryD_cert_patterns = [
    "nutrition certification", "nutrition program", "certification", "course", "training", "credential"
  ];

  const categoryD_clinical_patterns = [
    "dietetic internship", "continuing education", "clinical rotation", "rd exam", "preceptor", "ceu"
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

  // Category A, B, C, D Matches
  const matchedA = categoryA_patterns.some(p => matchPattern(t, p));
  const matchedB = categoryB_patterns.some(p => matchPattern(t, p));
  const matchedC = categoryC_patterns.some(p => matchPattern(t, p));
  const matchedD_cert = categoryD_cert_patterns.some(p => matchPattern(t, p));
  const matchedD_clinical = categoryD_clinical_patterns.some(p => matchPattern(t, p));

  const matched_tags: string[] = [];
  if (matchedA) matched_tags.push("professional_identity_match");
  if (matchedB) matched_tags.push("career_transition_intent");
  if (matchedC) matched_tags.push("side_income_intent");
  if (matchedD_cert) matched_tags.push("certification_interest");
  if (matchedD_clinical) matched_tags.push("clinical_advancement_intent");

  // Helper to check for pattern match
  const findMatch = (patterns: string[]) => patterns.find(p => t.includes(p.toLowerCase()));

  const matchedSeller = findMatch(sellerPatterns);
  const matchedCertSeller = findMatch(certificationSellerPatterns);
  const matchedPreservation = findMatch(prospectPreservationPatterns);

  const hasSellerIndicator = !!matchedSeller || !!matchedCertSeller;
  const hasIdentity = matchedA;
  const hasIntent = matchedB || matchedC || matchedD_cert || matchedD_clinical;
  const intentCount = (matchedB ? 1 : 0) + (matchedC ? 1 : 0) + (matchedD_cert ? 1 : 0) + (matchedD_clinical ? 1 : 0);
  
  // S13-T02 clinical advancement (Category D Clinical) acts as an implicit professional identity match
  const isProspect = (hasIdentity && hasIntent) || !!matchedPreservation || matchedD_clinical;
  const isMultiSignalBoost = isProspect && (intentCount >= 2);
  if (isMultiSignalBoost) {
    matched_tags.push("multi_signal_boost");
  }

  // 1. Seller Conflict Protection Heuristic
  if (isProspect && hasSellerIndicator) {
    const personalExplorationPatterns = [
      "i'm a", "i'm an", "i am a", "i am an", "i'm", "i am", "how do i", "how can i", "how can a", "i want", "how to transition",
      "should i", "what ceu should i", "what credential should i", "interested in", "looking for", "want to", "my career", "study for my", "for my own",
      "how to become", "want a side", "changing careers", "change careers"
    ];
    const isPersonalExploration = personalExplorationPatterns.some(p => t.includes(p));

    if (isPersonalExploration) {
      console.log(JSON.stringify({
        event: "seller_prospect_conflict_resolved",
        signal_id: signalId,
        resolution: "prospect_preserved",
        reason: "personal_exploration_language",
        status: "ok"
      }));

      console.log(JSON.stringify({
        event: "prospect_candidate_detected",
        signal_id: signalId,
        matched_tags: matched_tags,
        status: "ok"
      }));

      return {
        category: 'prospect_candidate',
        matched_priority_pattern: matchedPreservation || "prospect_intent_match",
        matched_tags
      };
    } else {
      console.log(JSON.stringify({
        event: "seller_prospect_conflict_resolved",
        signal_id: signalId,
        resolution: "seller_suppressed",
        reason: "outbound_promotion_language",
        status: "ok"
      }));

      if (matchedSeller) {
        console.log(JSON.stringify({
          event: "seller_candidate_detected",
          timestamp: new Date().toISOString(),
          signal_id: signalId,
          matched_pattern: matchedSeller,
          status: "ok"
        }));
        return { category: 'seller_candidate', matched_exclusion_pattern: matchedSeller, matched_tags };
      } else {
        console.log(JSON.stringify({
          event: "seller_candidate_detected",
          timestamp: new Date().toISOString(),
          signal_id: signalId,
          matched_pattern: matchedCertSeller,
          status: "ok"
        }));
        return { category: 'promoter_candidate', matched_exclusion_pattern: matchedCertSeller, matched_tags };
      }
    }
  }

  // 2. Pure Prospect Signal Detection
  if (isProspect) {
    console.log(JSON.stringify({
      event: "prospect_candidate_detected",
      signal_id: signalId,
      matched_tags: matched_tags,
      status: "ok"
    }));

    return {
      category: 'prospect_candidate',
      matched_priority_pattern: matchedPreservation || "prospect_intent_match",
      matched_tags
    };
  }

  // 3. Pure Seller / Promoter Contamination Detection
  if (matchedSeller) {
    console.log(JSON.stringify({
      event: "seller_candidate_detected",
      timestamp: new Date().toISOString(),
      signal_id: signalId,
      matched_pattern: matchedSeller,
      status: "ok"
    }));
    return { category: 'seller_candidate', matched_exclusion_pattern: matchedSeller, matched_tags };
  }

  if (matchedCertSeller) {
    console.log(JSON.stringify({
      event: "seller_candidate_detected",
      timestamp: new Date().toISOString(),
      signal_id: signalId,
      matched_pattern: matchedCertSeller,
      status: "ok"
    }));
    return { category: 'promoter_candidate', matched_exclusion_pattern: matchedCertSeller, matched_tags };
  }

  // 4. Fallback to existing GIME Intent Refinement Flow
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
    return { category: 'priority_candidate', matched_priority_pattern: matchedPriority, matched_tags };
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
    return { category: 'priority_candidate', matched_exclusion_pattern: matchedExclusion, matched_priority_pattern: matchedProfession, matched_tags };
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
    return { category: 'excluded_low_intent', matched_exclusion_pattern: matchedExclusion, matched_tags };
  }

  // Neutral
  return { category: 'neutral_candidate', matched_tags };
}

