import fs from "fs";
import path from "path";

// Define Mock signals
interface MockSignal {
  signal_id: string;
  username: string;
  author_id: string;
  source_url: string;
  created_at: string;
  priority_tier: string;
  signal_score: number;
  raw_text: string;
  context_tags?: string[];
  primary_category?: string;
  signal_type?: string;
}

// 1. Create a suite of mock signals representing diverse scenarios
const mockSignals: MockSignal[] = [
  // 1. Category A - Low-Intent Noise (GRWM / Vlog Noise)
  {
    signal_id: "sig-noise-a1",
    username: "VloggerQueen",
    author_id: "vlog-queen",
    source_url: "https://tiktok.com/@vloggerqueen/video/1",
    created_at: "2026-05-22T10:00:00.000Z",
    priority_tier: "LOW",
    signal_score: 2,
    raw_text: "GRWM for my aesthetic morning routine! my wellness era starts now #fitcheck vlog",
    context_tags: [],
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  },
  // 2. Category A - Low-Intent Overridden by clinical_advancement_intent
  {
    signal_id: "sig-noise-a2",
    username: "CoachRN",
    author_id: "coach-rn",
    source_url: "https://tiktok.com/@coachrn/video/2",
    created_at: "2026-05-22T10:05:00.000Z",
    priority_tier: "MEDIUM",
    signal_score: 6,
    raw_text: "GRWM as a bedside nurse transitioning to clinical wellness coaching!",
    context_tags: ["clinical_advancement_intent"],
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  },
  // 3. Category B - Generic Wellness Filler Noise
  {
    signal_id: "sig-noise-b1",
    username: "HealthyVibes",
    author_id: "healthy-vibes",
    source_url: "https://tiktok.com/@healthyvibes/video/3",
    created_at: "2026-05-22T10:10:00.000Z",
    priority_tier: "LOW",
    signal_score: 3,
    raw_text: "routine reset romanticize your life self care day! good vibes only #wellnessjourney",
    context_tags: [],
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  },
  // 4. Category B - Low-Intent Overridden by Monetization category
  {
    signal_id: "sig-noise-b2",
    username: "FitBizOwner",
    author_id: "fit-biz-owner",
    source_url: "https://tiktok.com/@fitbizowner/video/4",
    created_at: "2026-05-22T10:15:00.000Z",
    priority_tier: "HIGH",
    signal_score: 8,
    raw_text: "This wellness journey has built a 6-figure side-income model! Let me know if you want the blueprint.",
    context_tags: [],
    primary_category: "Monetization",
    signal_type: "Comment"
  },
  // 5. Category C - Motivational Filler Noise
  {
    signal_id: "sig-noise-c1",
    username: "GuruDave",
    author_id: "guru-dave",
    source_url: "https://tiktok.com/@gurudave/video/5",
    created_at: "2026-05-22T10:20:00.000Z",
    priority_tier: "LOW",
    signal_score: 1,
    raw_text: "consistency is key! trust the process, small steps every day. believe in yourself just start!",
    context_tags: [],
    primary_category: "UNCLASSIFIED",
    signal_type: "Comment"
  },
  // 6. Category C - Low-Intent Overridden by Question signal type
  {
    signal_id: "sig-noise-c2",
    username: "ConfusedTrainer",
    author_id: "confused-trainer",
    source_url: "https://tiktok.com/@confusedtrainer/video/6",
    created_at: "2026-05-22T10:25:00.000Z",
    priority_tier: "MEDIUM",
    signal_score: 5,
    raw_text: "keep going and believe in yourself! but wait, is it better to transition to clinical or stick with vlogs?",
    context_tags: [],
    primary_category: "UNCLASSIFIED",
    signal_type: "Question"
  }
];

// Wrap signals to simulate Supabase format where structured_post has nested data
const SupabaseSignals = mockSignals.map(s => ({
  signal_id: s.signal_id,
  username: s.username,
  author_id: s.author_id,
  source_url: s.source_url,
  created_at: s.created_at,
  priority_tier: s.priority_tier,
  signal_score: s.signal_score,
  raw_text: s.raw_text,
  context_tags: s.context_tags || [],
  structured_post: {
    raw_text: s.raw_text,
    priority_tier: s.priority_tier,
    signal_score: { score: s.signal_score },
    classification: {
      primary_category: s.primary_category || "UNCLASSIFIED",
      signal_type: s.signal_type || "Comment",
      context_tags: s.context_tags || []
    },
    source: {
      platform: "tiktok",
      username: s.username,
      author_id: s.author_id,
      source_url: s.source_url,
      timestamp: s.created_at
    }
  }
})) as any[];

// Helper functions copied exactly from server/src/routes/admin.ts
function getTierPriority(tier: string): number {
  if (!tier) return 0;
  const upper = tier.toUpperCase();
  if (upper === 'HIGH') return 3;
  if (upper === 'MEDIUM') return 2;
  if (upper === 'LOW') return 1;
  return 0;
}

function isProspectCandidate(s: any): boolean {
  if (!s) return false;
  let sp = s.structured_post;
  if (sp?.structured_post) sp = sp.structured_post;
  
  const tags = sp?.classification?.context_tags || sp?.data?.classification?.context_tags || s.context_tags || [];
  return Array.isArray(tags) && tags.includes('prospect_candidate');
}

function getSignalScore(s: any): number {
  if (!s) return 0;
  if (typeof s.signal_score === 'number') return s.signal_score;
  let sp = s.structured_post;
  if (sp?.structured_post) sp = sp.structured_post;
  return sp?.signal_score?.score || sp?.signal_score || 0;
}

function getSignalTime(s: any): number {
  if (!s) return 0;
  let sp = s.structured_post;
  if (sp?.structured_post) sp = sp.structured_post;
  return new Date(s.created_at || sp?.source?.timestamp || s.ingested_at || 0).getTime();
}

function normalizeUrl(url: string): string {
  if (!url) return '';
  try {
    let clean = url.trim().toLowerCase();
    clean = clean.split('?')[0];
    if (clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    clean = clean.replace('://www.', '://');
    return clean;
  } catch (e) {
    return url.trim().toLowerCase();
  }
}

function getSignalText(s: any): string {
  if (!s) return '';
  let sp = s.structured_post;
  if (sp?.structured_post) sp = sp.structured_post;
  return s.raw_text || s.text || sp?.raw_text || sp?.text || '';
}

function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTokens(text: string): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  return normalized.split(' ').filter(t => t.length > 1);
}

function getNearDuplicateSimilarity(textA: string, textB: string): number {
  const tokensA = getTokens(textA);
  const tokensB = getTokens(textB);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  
  let intersect = 0;
  for (const t of setA) {
    if (setB.has(t)) {
      intersect++;
    }
  }
  
  const unionSize = new Set([...tokensA, ...tokensB]).size;
  if (unionSize === 0) return 0;
  return intersect / unionSize;
}

function haveProspectVariance(a: any, b: any): boolean {
  const tagsA = a.context_tags || a.structured_post?.classification?.context_tags || a.structured_post?.data?.classification?.context_tags || [];
  const tagsB = b.context_tags || b.structured_post?.classification?.context_tags || b.structured_post?.data?.classification?.context_tags || [];
  
  const isProspectA = isProspectCandidate(a);
  const isProspectB = isProspectCandidate(b);
  if (isProspectA !== isProspectB) {
    return true; 
  }
  
  if (isProspectA && isProspectB) {
    const profs = ["nurse", "dietitian", "dietician", "therapist", "teacher", "coach", "practitioner", "clinical", "trainer", "clinician", "md", "rn", "rd"];
    const textA = getSignalText(a).toLowerCase();
    const textB = getSignalText(b).toLowerCase();
    
    const matchedA = profs.filter(p => textA.includes(p));
    const matchedB = profs.filter(p => textB.includes(p));
    
    const diffA = matchedA.filter(x => !matchedB.includes(x));
    const diffB = matchedB.filter(x => !matchedA.includes(x));
    if (diffA.length > 0 || diffB.length > 0) {
      return true;
    }
  }
  return false;
}

// S13-T05 Low-Intent Noise Calibration Pipeline Execution
async function runLowIntentValidation() {
  console.log("=================================================================");
  console.log("    AIME S13-T05 LOW-INTENT NOISE CALIBRATION VERIFICATION TEST  ");
  console.log("=================================================================");

  function getContextTags(s: any): string[] {
    if (!s) return [];
    let sp = s.structured_post;
    if (sp?.structured_post) sp = sp.structured_post;
    return sp?.classification?.context_tags || sp?.data?.classification?.context_tags || s.context_tags || [];
  }

  function getPrimaryCategory(s: any): string {
    if (!s) return '';
    let sp = s.structured_post;
    if (sp?.structured_post) sp = sp.structured_post;
    return sp?.classification?.primary_category || sp?.data?.classification?.primary_category || '';
  }

  function getSignalType(s: any): string {
    if (!s) return '';
    let sp = s.structured_post;
    if (sp?.structured_post) sp = sp.structured_post;
    return sp?.classification?.signal_type || sp?.data?.classification?.signal_type || '';
  }

  function isStrongIntent(s: any): { strong: boolean; reason: string } {
    if (isProspectCandidate(s)) {
      return { strong: true, reason: "prospect_candidate" };
    }
    const tags = getContextTags(s) || [];
    const strongTags = [
      "professional_identity_match",
      "side_income_intent",
      "career_transition_intent",
      "certification_interest",
      "clinical_advancement_intent"
    ];
    for (const st of strongTags) {
      if (tags.includes(st)) {
        return { strong: true, reason: st };
      }
    }
    
    const cat = getPrimaryCategory(s).toLowerCase();
    const type = getSignalType(s).toLowerCase();
    
    const checkTerms = ["monetization", "problem", "question"];
    for (const term of checkTerms) {
      if (cat === term || type === term || tags.some(t => t.toLowerCase() === term)) {
        return { strong: true, reason: term };
      }
    }
    return { strong: false, reason: "" };
  }

  const categoryAPatterns = [
    "grwm", "day in the life", "spend the day with me", "come with me", "vlog",
    "morning routine", "night routine", "wellness routine", "what i eat in a day",
    "aesthetic", "my wellness era", "gym fit", "fit check"
  ];
  const categoryBPatterns = [
    "wellness journey", "healthy lifestyle", "self care day", "good vibes",
    "reset day", "glow up", "routine reset", "romanticize your life"
  ];
  const categoryCPatterns = [
    "you got this", "trust the process", "consistency is key", "small steps",
    "just start", "keep going", "believe in yourself"
  ];

  function detectLowIntent(normText: string): { matched: boolean; pattern: string; category: string } {
    if (!normText) return { matched: false, pattern: "", category: "" };

    for (const p of categoryAPatterns) {
      if (normText.includes(p)) {
        return { matched: true, pattern: p, category: "lifestyle_vlog" };
      }
    }
    for (const p of categoryBPatterns) {
      if (normText.includes(p)) {
        return { matched: true, pattern: p, category: "wellness_filler" };
      }
    }
    for (const p of categoryCPatterns) {
      if (normText.includes(p)) {
        return { matched: true, pattern: p, category: "motivational_filler" };
      }
    }

    return { matched: false, pattern: "", category: "" };
  }

  const LOW_INFO_PATTERNS = [
    "this is amazing",
    "so true",
    "wow",
    "great info",
    "love this",
    "need this",
    "dm me"
  ];

  const duplicateClusters: any[][] = [];
  const lowInfoSignals: any[] = [];
  const mainSignals: any[] = [];
  const telemetryLogs: any[] = [];

  // First pass: identify low-info and low-intent comments and separate/preserve
  for (const s of SupabaseSignals) {
    const text = getSignalText(s);
    const norm = normalizeText(text);
    const lowIntent = detectLowIntent(norm);
    const isProspect = isProspectCandidate(s);
    
    if (lowIntent.matched) {
      const safeguard = isStrongIntent(s);
      if (safeguard.strong) {
        // PRESERVE the signal (do not collapse)
        const metadata = {
          is_low_intent: false,
          matched_pattern: lowIntent.pattern,
          noise_category: lowIntent.category,
          low_intent_phrase_overridden: true,
          override_reason: safeguard.reason
        };
        s.low_intent_noise = metadata;
        if (s.structured_post) {
          s.structured_post.low_intent_noise = metadata;
        }
        
        // Append tag
        const tags = getContextTags(s);
        if (!tags.includes("low_intent_phrase_overridden")) {
          tags.push("low_intent_phrase_overridden");
        }
        if (s.context_tags) s.context_tags = tags;

        telemetryLogs.push({
          event: "low_intent_preserved_by_intent_override",
          signal_id: s.signal_id,
          low_intent_pattern: lowIntent.pattern,
          override_reason: safeguard.reason,
          status: "ok"
        });

        mainSignals.push(s);
      } else {
        // Collapse low-intent noise signal
        const metadata = {
          is_low_intent: true,
          matched_pattern: lowIntent.pattern,
          noise_category: lowIntent.category,
          low_intent_phrase_overridden: false
        };
        s.low_intent_noise = metadata;
        if (s.structured_post) {
          s.structured_post.low_intent_noise = metadata;
        }

        // Append tag
        const tags = getContextTags(s);
        if (!tags.includes("low_intent_noise")) {
          tags.push("low_intent_noise");
        }
        if (s.context_tags) s.context_tags = tags;

        s.duplicate_control = {
          cluster_id: "low-intent-suppressed",
          duplicate_type: "low_intent_noise",
          is_cluster_representative: false,
          cluster_size: 1,
          collapsed: true
        };
        if (s.structured_post) {
          s.structured_post.duplicate_control = s.duplicate_control;
        }

        telemetryLogs.push({
          event: "low_intent_noise_detected",
          signal_id: s.signal_id,
          matched_pattern: lowIntent.pattern,
          noise_category: lowIntent.category,
          status: "ok"
        });
        telemetryLogs.push({
          event: "low_intent_signal_collapsed",
          signal_id: s.signal_id,
          matched_pattern: lowIntent.pattern,
          status: "ok"
        });

        lowInfoSignals.push(s);
      }
    } else {
      const isLowInfo = LOW_INFO_PATTERNS.includes(norm);
      
      const metadata = {
        is_low_intent: false,
        low_intent_phrase_overridden: false
      };
      s.low_intent_noise = metadata;
      if (s.structured_post) {
        s.structured_post.low_intent_noise = metadata;
      }

      if (isLowInfo && !isProspect && getTierPriority(s.priority_tier || s.structured_post?.priority_tier || 'LOW') <= 1) {
        s.duplicate_control = {
          cluster_id: "low-info-suppressed",
          duplicate_type: "low_information",
          is_cluster_representative: false,
          cluster_size: 1,
          collapsed: true
        };
        if (s.structured_post) {
          s.structured_post.duplicate_control = s.duplicate_control;
        }
        lowInfoSignals.push(s);

        telemetryLogs.push({
          event: "low_information_signal_collapsed",
          signal_id: s.signal_id,
          matched_pattern: norm,
          status: "ok"
        });
      } else {
        mainSignals.push(s);
      }
    }
  }

  // Second pass: Cluster exact duplicates and near-duplicates on mainSignals
  for (const s of mainSignals) {
    let matchedCluster = null;
    for (const cluster of duplicateClusters) {
      const rep = cluster[0];
      const textA = getSignalText(s);
      const textB = getSignalText(rep);
      const normA = normalizeText(textA);
      const normB = normalizeText(textB);
      const isExact = (normA === normB && normA !== '');
      const isNear = getNearDuplicateSimilarity(textA, textB) >= 0.7;
      
      if ((isExact || isNear) && !haveProspectVariance(s, rep)) {
        matchedCluster = cluster;
        break;
      }
    }
    if (matchedCluster) {
      matchedCluster.push(s);
    } else {
      duplicateClusters.push([s]);
    }
  }

  // Third pass: Mark representatives vs collapsed variants in each cluster
  const processedSignals: any[] = [];
  let clusterCounter = 1;

  for (const cluster of duplicateClusters) {
    const clusterSize = cluster.length;
    if (clusterSize === 1) {
      const s = cluster[0];
      s.duplicate_control = {
        cluster_id: `dup-cluster-${clusterCounter++}`,
        duplicate_type: "none",
        is_cluster_representative: true,
        cluster_size: 1,
        collapsed: false
      };
      processedSignals.push(s);
    } else {
      cluster.sort((a, b) => {
        const isProspectA = isProspectCandidate(a);
        const isProspectB = isProspectCandidate(b);
        if (isProspectA !== isProspectB) return isProspectA ? -1 : 1;
        const tierA = getTierPriority(a.priority_tier || a.structured_post?.priority_tier || 'LOW');
        const tierB = getTierPriority(b.priority_tier || b.structured_post?.priority_tier || 'LOW');
        if (tierA !== tierB) return tierB - tierA;
        return getSignalScore(b) - getSignalScore(a);
      });

      const clusterId = `dup-cluster-${clusterCounter++}`;
      const rep = cluster[0];
      rep.duplicate_control = {
        cluster_id: clusterId,
        duplicate_type: "none",
        is_cluster_representative: true,
        cluster_size: clusterSize,
        collapsed: false
      };
      processedSignals.push(rep);

      for (let i = 1; i < clusterSize; i++) {
        const s = cluster[i];
        s.duplicate_control = {
          cluster_id: clusterId,
          duplicate_type: "near_duplicate",
          is_cluster_representative: false,
          cluster_size: clusterSize,
          collapsed: true
        };
        processedSignals.push(s);
      }
    }
  }

  const enrichedSignals = [...processedSignals, ...lowInfoSignals];

  // Assertions
  console.log("\n1. Category A (Lifestyle / Vlog Noise) Assertion:");
  const noiseA1 = enrichedSignals.find(s => s.signal_id === "sig-noise-a1");
  const noiseA2 = enrichedSignals.find(s => s.signal_id === "sig-noise-a2");

  console.log(`- sig-noise-a1: is_low_intent=${noiseA1.low_intent_noise?.is_low_intent}, collapsed=${noiseA1.duplicate_control?.collapsed}, tags=[${getContextTags(noiseA1).join(", ")}]`);
  console.log(`- sig-noise-a2: is_low_intent=${noiseA2.low_intent_noise?.is_low_intent}, collapsed=${noiseA2.duplicate_control?.collapsed}, override_reason=${noiseA2.low_intent_noise?.override_reason}, tags=[${getContextTags(noiseA2).join(", ")}]`);

  if (noiseA1.low_intent_noise?.is_low_intent !== true || noiseA1.duplicate_control?.collapsed !== true || !getContextTags(noiseA1).includes("low_intent_noise")) {
    console.error("❌ Category A noise failed to collapse!");
    process.exit(1);
  }
  if (noiseA2.low_intent_noise?.is_low_intent === true || noiseA2.duplicate_control?.collapsed === true || !getContextTags(noiseA2).includes("low_intent_phrase_overridden") || noiseA2.low_intent_noise?.override_reason !== "clinical_advancement_intent") {
    console.error("❌ Category A noise was incorrectly collapsed despite clinical override!");
    process.exit(1);
  }
  console.log("✅ Category A passed successfully!");

  console.log("\n2. Category B (Generic Wellness Filler) Assertion:");
  const noiseB1 = enrichedSignals.find(s => s.signal_id === "sig-noise-b1");
  const noiseB2 = enrichedSignals.find(s => s.signal_id === "sig-noise-b2");

  console.log(`- sig-noise-b1: is_low_intent=${noiseB1.low_intent_noise?.is_low_intent}, collapsed=${noiseB1.duplicate_control?.collapsed}, tags=[${getContextTags(noiseB1).join(", ")}]`);
  console.log(`- sig-noise-b2: is_low_intent=${noiseB2.low_intent_noise?.is_low_intent}, collapsed=${noiseB2.duplicate_control?.collapsed}, override_reason=${noiseB2.low_intent_noise?.override_reason}, tags=[${getContextTags(noiseB2).join(", ")}]`);

  if (noiseB1.low_intent_noise?.is_low_intent !== true || noiseB1.duplicate_control?.collapsed !== true || !getContextTags(noiseB1).includes("low_intent_noise")) {
    console.error("❌ Category B noise failed to collapse!");
    process.exit(1);
  }
  if (noiseB2.low_intent_noise?.is_low_intent === true || noiseB2.duplicate_control?.collapsed === true || !getContextTags(noiseB2).includes("low_intent_phrase_overridden") || noiseB2.low_intent_noise?.override_reason !== "monetization") {
    console.error("❌ Category B noise was incorrectly collapsed despite Monetization override!");
    process.exit(1);
  }
  console.log("✅ Category B passed successfully!");

  console.log("\n3. Category C (Motivational Filler) Assertion:");
  const noiseC1 = enrichedSignals.find(s => s.signal_id === "sig-noise-c1");
  const noiseC2 = enrichedSignals.find(s => s.signal_id === "sig-noise-c2");

  console.log(`- sig-noise-c1: is_low_intent=${noiseC1.low_intent_noise?.is_low_intent}, collapsed=${noiseC1.duplicate_control?.collapsed}, tags=[${getContextTags(noiseC1).join(", ")}]`);
  console.log(`- sig-noise-c2: is_low_intent=${noiseC2.low_intent_noise?.is_low_intent}, collapsed=${noiseC2.duplicate_control?.collapsed}, override_reason=${noiseC2.low_intent_noise?.override_reason}, tags=[${getContextTags(noiseC2).join(", ")}]`);

  if (noiseC1.low_intent_noise?.is_low_intent !== true || noiseC1.duplicate_control?.collapsed !== true || !getContextTags(noiseC1).includes("low_intent_noise")) {
    console.error("❌ Category C noise failed to collapse!");
    process.exit(1);
  }
  if (noiseC2.low_intent_noise?.is_low_intent === true || noiseC2.duplicate_control?.collapsed === true || !getContextTags(noiseC2).includes("low_intent_phrase_overridden") || noiseC2.low_intent_noise?.override_reason !== "question") {
    console.error("❌ Category C noise was incorrectly collapsed despite Question override!");
    process.exit(1);
  }
  console.log("✅ Category C passed successfully!");

  console.log("\n4. Telemetry Schema Verification:");
  console.log("- Telemetry logs:");
  console.log(JSON.stringify(telemetryLogs, null, 2));

  const logDetected = telemetryLogs.find(l => l.event === "low_intent_noise_detected");
  const logCollapsed = telemetryLogs.find(l => l.event === "low_intent_signal_collapsed");
  const logOverride = telemetryLogs.find(l => l.event === "low_intent_preserved_by_intent_override");

  if (!logDetected || logDetected.status !== "ok" || !logDetected.noise_category) {
    console.error("❌ Missing or invalid low_intent_noise_detected log schema");
    process.exit(1);
  }
  if (!logCollapsed || logCollapsed.status !== "ok" || !logCollapsed.matched_pattern) {
    console.error("❌ Missing or invalid low_intent_signal_collapsed log schema");
    process.exit(1);
  }
  if (!logOverride || logOverride.status !== "ok" || logOverride.override_reason !== "clinical_advancement_intent") {
    console.error("❌ Missing or invalid low_intent_preserved_by_intent_override log schema");
    process.exit(1);
  }
  console.log("✅ Telemetry logging verified successfully!");

  console.log("\n5. Zero Data Loss Verification:");
  console.log(`- Input Signals: ${SupabaseSignals.length}`);
  console.log(`- Output Signals: ${enrichedSignals.length}`);

  if (SupabaseSignals.length !== enrichedSignals.length) {
    console.error("❌ Output signals count doesn't match input! Data loss occurred!");
    process.exit(1);
  }
  console.log("✅ Zero data loss verified successfully!");

  console.log("\n=================================================================");
  console.log("🟢 ALL S13-T05 LOW-INTENT NOISE CALIBRATION TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

runLowIntentValidation().catch(e => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
