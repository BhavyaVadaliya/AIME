import * as fs from 'fs';
import * as path from 'path';

export type IntentCategory = 'priority_candidate' | 'neutral_candidate' | 'excluded_low_intent';

export interface IntentRefinementResult {
  category: IntentCategory;
  matched_priority_pattern?: string;
  matched_exclusion_pattern?: string;
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

  // 1. Priority Candidate (Direct)
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

  // 2. Mixed-Signal Safeguard (Priority/Profession + Exclusion)
  // If we have an exclusion match BUT also a profession match, we retain it as a priority or neutral candidate.
  // The dev package suggests priority_candidate is preferred for mixed signals.
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

  // 3. Excluded Low-Intent
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

  // 4. Neutral
  return { category: 'neutral_candidate' };
}
