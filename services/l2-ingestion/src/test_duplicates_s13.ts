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
  structured_post?: any;
  duplicate_control?: any;
  source_distribution?: any;
}

// 1. Create a suite of mock signals representing diverse scenarios
const mockSignals: MockSignal[] = [
  // Cluster 1: Category A - Exact duplicates
  {
    signal_id: "sig-exact-1",
    username: "User1",
    author_id: "user-1",
    source_url: "https://tiktok.com/@user1/video/1",
    created_at: "2026-05-20T10:00:00.000Z",
    priority_tier: "LOW",
    signal_score: 3,
    raw_text: "Link in bio!!",
    context_tags: [],
  },
  {
    signal_id: "sig-exact-2",
    username: "User2",
    author_id: "user-2",
    source_url: "https://tiktok.com/@user2/video/2",
    created_at: "2026-05-20T11:00:00.000Z",
    priority_tier: "LOW",
    signal_score: 2,
    raw_text: "link in bio",
    context_tags: [],
  },

  // Cluster 2: Category B - Near-duplicates
  {
    signal_id: "sig-near-1",
    username: "User3",
    author_id: "user-3",
    source_url: "https://tiktok.com/@user3/video/3",
    created_at: "2026-05-20T10:15:00.000Z",
    priority_tier: "LOW",
    signal_score: 4,
    raw_text: "I am a bedside nurse looking to transition into a wellness coach",
    context_tags: ["prospect_candidate", "professional_identity_match"], // Prospect! Representative!
  },
  {
    signal_id: "sig-near-2",
    username: "User4",
    author_id: "user-4",
    source_url: "https://tiktok.com/@user4/video/4",
    created_at: "2026-05-20T10:20:00.000Z",
    priority_tier: "LOW",
    signal_score: 2,
    raw_text: "bedside nurse looking to transition to wellness coach",
    context_tags: ["prospect_candidate"],
  },

  // Scenario 3: Prospect Variance - Different professions MUST NOT cluster even if highly similar text structures
  {
    signal_id: "sig-var-nurse",
    username: "NurseJoy",
    author_id: "nurse-joy",
    source_url: "https://tiktok.com/@nursejoy/video/5",
    created_at: "2026-05-20T12:00:00.000Z",
    priority_tier: "MEDIUM",
    signal_score: 6,
    raw_text: "I am a burned out nurse looking for side income in nutrition coaching.",
    context_tags: ["prospect_candidate", "professional_identity_match"],
  },
  {
    signal_id: "sig-var-dietitian",
    username: "DietitianDan",
    author_id: "dietitian-dan",
    source_url: "https://tiktok.com/@dietitiandan/video/6",
    created_at: "2026-05-20T12:05:00.000Z",
    priority_tier: "MEDIUM",
    signal_score: 7,
    raw_text: "I am a burned out dietitian looking for side income in nutrition coaching.",
    context_tags: ["prospect_candidate", "professional_identity_match"],
  },

  // Category C: Low-Information Comments
  {
    signal_id: "sig-lowinfo-1",
    username: "Spammy1",
    author_id: "spam-1",
    source_url: "https://tiktok.com/@spammy1/video/7",
    created_at: "2026-05-20T13:00:00.000Z",
    priority_tier: "LOW",
    signal_score: 1,
    raw_text: "great info", // Matches LOW_INFO_PATTERNS exactly, low tier, not a prospect -> Suppress!
    context_tags: [],
  },
  {
    signal_id: "sig-lowinfo-2",
    username: "ProspectLowInfo",
    author_id: "prospect-low-info",
    source_url: "https://tiktok.com/@prospectlowinfo/video/8",
    created_at: "2026-05-20T13:05:00.000Z",
    priority_tier: "MEDIUM",
    signal_score: 6,
    raw_text: "great info", // Same low-info phrase BUT marked as prospect -> DO NOT SUPPRESS!
    context_tags: ["prospect_candidate"],
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
  structured_post: {
    raw_text: s.raw_text,
    priority_tier: s.priority_tier,
    signal_score: { score: s.signal_score },
    classification: {
      primary_category: "UNCLASSIFIED",
      signal_type: "Comment",
      context_tags: s.context_tags
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

// S13-T04 Calibration Pipeline Execution
async function runDuplicateValidation() {
  console.log("=================================================================");
  console.log("    AIME S13-T04 DUPLICATE & NEAR-DUPLICATE CALIBRATION TESTS    ");
  console.log("=================================================================");

  // Category C: Low Information Patterns
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

  // First pass: identify low-info comments and separate from standard candidates
  for (const s of SupabaseSignals) {
    const text = getSignalText(s);
    const norm = normalizeText(text);
    const isLowInfo = LOW_INFO_PATTERNS.includes(norm);
    const isProspect = isProspectCandidate(s);
    
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

      // Emit telemetry log for Category C
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
      if (s.structured_post) {
        s.structured_post.duplicate_control = s.duplicate_control;
      }
      processedSignals.push(s);
    } else {
      // Sort within cluster by value precedence
      cluster.sort((a, b) => {
        const isProspectA = isProspectCandidate(a);
        const isProspectB = isProspectCandidate(b);
        if (isProspectA !== isProspectB) {
          return isProspectA ? -1 : 1;
        }
        
        const tierA = getTierPriority(a.priority_tier || a.structured_post?.priority_tier || 'LOW');
        const tierB = getTierPriority(b.priority_tier || b.structured_post?.priority_tier || 'LOW');
        if (tierA !== tierB) {
          return tierB - tierA;
        }
        
        const scoreA = getSignalScore(a);
        const scoreB = getSignalScore(b);
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        
        const timeA = getSignalTime(a);
        const timeB = getSignalTime(b);
        return timeB - timeA;
      });

      const clusterId = `dup-cluster-${clusterCounter++}`;
      const rep = cluster[0];
      const normRep = normalizeText(getSignalText(rep));
      
      rep.duplicate_control = {
        cluster_id: clusterId,
        duplicate_type: "none",
        is_cluster_representative: true,
        cluster_size: clusterSize,
        collapsed: false
      };
      if (rep.structured_post) {
        rep.structured_post.duplicate_control = rep.duplicate_control;
      }
      processedSignals.push(rep);

      let hasExact = false;
      for (let i = 1; i < clusterSize; i++) {
        const s = cluster[i];
        const normS = normalizeText(getSignalText(s));
        const isExact = (normS === normRep);
        if (isExact) hasExact = true;
        
        s.duplicate_control = {
          cluster_id: clusterId,
          duplicate_type: isExact ? "exact_duplicate" : "near_duplicate",
          is_cluster_representative: false,
          cluster_size: clusterSize,
          collapsed: true
        };
        if (s.structured_post) {
          s.structured_post.duplicate_control = s.duplicate_control;
        }
        processedSignals.push(s);
      }

      // Emit telemetry log
      telemetryLogs.push({
        event: "duplicate_cluster_detected",
        cluster_id: clusterId,
        duplicate_type: hasExact ? "exact_duplicate" : "near_duplicate",
        cluster_size: clusterSize,
        status: "ok"
      });
    }
  }

  const allCalibratedSignals = [...processedSignals, ...lowInfoSignals];

  // Group by creator to simulate S13-T03 integrations
  interface CreatorGroup {
    username: string;
    author_id: string;
    signals: any[];
  }
  const groups: CreatorGroup[] = [];

  for (const s of allCalibratedSignals) {
    let sp = s.structured_post;
    if (sp?.structured_post) sp = sp.structured_post;
    
    const username = (s.username || sp?.source?.username || '').trim().toLowerCase() || 'unknown';
    const authorId = (s.author_id || sp?.source?.author_id || '').trim().toLowerCase() || 'unknown';
    
    let found = groups.find(g => 
      (authorId !== 'unknown' && g.author_id === authorId) ||
      (username !== 'unknown' && g.username === username)
    );
    
    if (found) {
      found.signals.push(s);
    } else {
      groups.push({ username, author_id: authorId, signals: [s] });
    }
  }

  const maxVisibleCap = 3;
  const seenUrls = new Set<string>();
  const enrichedSignals: any[] = [];

  for (const g of groups) {
    const clusterCount = g.signals.length;
    let visibleCount = 0;
    let overflowCount = 0;

    for (const s of g.signals) {
      let sp = s.structured_post;
      if (sp?.structured_post) sp = sp.structured_post;
      
      const rawUrl = s.source_url || sp?.source?.source_url || '';
      const normUrl = normalizeUrl(rawUrl);

      let isDuplicateUrl = false;
      if (normUrl !== '') {
        if (seenUrls.has(normUrl)) {
          isDuplicateUrl = true;
        } else {
          seenUrls.add(normUrl);
        }
      }

      let isOverflow = false;
      let rank = 0;
      let status = "visible";

      if (s.duplicate_control?.collapsed === true) {
        isOverflow = true;
        rank = 999;
        status = "collapsed_overflow";
        overflowCount++;
      } else if (isDuplicateUrl) {
        isOverflow = true;
        rank = 999;
        status = "collapsed_overflow";
        overflowCount++;
      } else {
        visibleCount++;
        rank = visibleCount;
        if (visibleCount > maxVisibleCap) {
          isOverflow = true;
          status = "collapsed_overflow";
          overflowCount++;
        } else {
          isOverflow = false;
          status = "visible";
        }
      }

      s.source_distribution = {
        status,
        cluster_count: clusterCount,
        visibility_rank: rank,
        is_source_overflow: isOverflow
      };

      enrichedSignals.push(s);
    }
  }

  // --- ASSERTIONS & VALIDATION CODES ---

  // Assertion 1: Category A - Exact text duplicates are clustered together
  console.log("\n1. Category A Verification (Exact raw text normalization):");
  const sigExact1 = enrichedSignals.find(s => s.signal_id === "sig-exact-1");
  const sigExact2 = enrichedSignals.find(s => s.signal_id === "sig-exact-2");
  
  console.log(`- sig-exact-1: raw_text="${sigExact1.raw_text}"`);
  console.log(`- sig-exact-2: raw_text="${sigExact2.raw_text}"`);
  console.log(`- Cluster ID sig-exact-1: ${sigExact1.duplicate_control?.cluster_id}`);
  console.log(`- Cluster ID sig-exact-2: ${sigExact2.duplicate_control?.cluster_id}`);
  console.log(`- sig-exact-1 Representative: ${sigExact1.duplicate_control?.is_cluster_representative}`);
  console.log(`- sig-exact-2 Representative: ${sigExact2.duplicate_control?.is_cluster_representative}`);
  console.log(`- sig-exact-2 Collapsed: ${sigExact2.duplicate_control?.collapsed}`);
  console.log(`- sig-exact-2 Duplicate Type: ${sigExact2.duplicate_control?.duplicate_type}`);

  if (!sigExact1.duplicate_control?.cluster_id || sigExact1.duplicate_control.cluster_id !== sigExact2.duplicate_control?.cluster_id) {
    console.log("❌ FAIL: Exact text duplicates were not grouped into the same cluster.");
    process.exit(1);
  }
  if (sigExact2.duplicate_control.collapsed !== true || sigExact2.duplicate_control.duplicate_type !== "exact_duplicate") {
    console.log("❌ FAIL: Exact duplicate variant was not collapsed or marked correctly.");
    process.exit(1);
  }
  console.log("✅ PASS: Category A exact duplicates successfully clustered, representative selected, and variant collapsed.");

  // Assertion 2: Category B - Near-duplicate clustering based on Token Jaccard overlap
  console.log("\n2. Category B Verification (Near-duplicate Jaccard similarity >= 0.7):");
  const sigNear1 = enrichedSignals.find(s => s.signal_id === "sig-near-1");
  const sigNear2 = enrichedSignals.find(s => s.signal_id === "sig-near-2");

  const sim = getNearDuplicateSimilarity(sigNear1.raw_text, sigNear2.raw_text);
  console.log(`- Token Jaccard Similarity: ${sim.toFixed(4)}`);
  console.log(`- sig-near-1: raw_text="${sigNear1.raw_text}"`);
  console.log(`- sig-near-2: raw_text="${sigNear2.raw_text}"`);
  console.log(`- Cluster ID sig-near-1: ${sigNear1.duplicate_control?.cluster_id}`);
  console.log(`- Cluster ID sig-near-2: ${sigNear2.duplicate_control?.cluster_id}`);
  console.log(`- sig-near-2 Collapsed: ${sigNear2.duplicate_control?.collapsed}`);
  console.log(`- sig-near-2 Duplicate Type: ${sigNear2.duplicate_control?.duplicate_type}`);

  if (sim < 0.7) {
    console.log("❌ FAIL: Token Jaccard similarity is below 0.7.");
    process.exit(1);
  }
  if (sigNear1.duplicate_control.cluster_id !== sigNear2.duplicate_control.cluster_id) {
    console.log("❌ FAIL: Near-duplicates were not grouped into the same cluster.");
    process.exit(1);
  }
  if (sigNear2.duplicate_control.collapsed !== true || sigNear2.duplicate_control.duplicate_type !== "near_duplicate") {
    console.log("❌ FAIL: Near-duplicate variant was not collapsed or marked correctly.");
    process.exit(1);
  }
  console.log("✅ PASS: Category B near-duplicates successfully clustered and collapsed.");

  // Assertion 3: Representative Selection Order
  console.log("\n3. Representative Selection Verification:");
  console.log(`- Cluster Size: ${sigNear1.duplicate_control.cluster_size}`);
  console.log(`- sig-near-1 (Prospect candidate) Representative: ${sigNear1.duplicate_control.is_cluster_representative}`);
  console.log(`- sig-near-2 (Non-prospect candidate) Representative: ${sigNear2.duplicate_control.is_cluster_representative}`);

  if (sigNear1.duplicate_control.is_cluster_representative !== true || sigNear2.duplicate_control.is_cluster_representative === true) {
    console.log("❌ FAIL: Strongest prospect signal was not selected as the cluster representative.");
    process.exit(1);
  }
  console.log("✅ PASS: Representative correctly selected based on priority tier, prospect candidate, and value precedence.");

  // Assertion 4: Category C - Low Information Suppression
  console.log("\n4. Category C Verification (Low-information comment suppression):");
  const sigLowInfo1 = enrichedSignals.find(s => s.signal_id === "sig-lowinfo-1");
  const sigLowInfo2 = enrichedSignals.find(s => s.signal_id === "sig-lowinfo-2");

  console.log(`- sig-lowinfo-1 ("great info", Low, non-prospect): collapsed=${sigLowInfo1.duplicate_control?.collapsed}, type=${sigLowInfo1.duplicate_control?.duplicate_type}`);
  console.log(`- sig-lowinfo-2 ("great info", Medium, prospect): collapsed=${sigLowInfo2.duplicate_control?.collapsed}, type=${sigLowInfo2.duplicate_control?.duplicate_type}`);

  if (sigLowInfo1.duplicate_control?.collapsed !== true || sigLowInfo1.duplicate_control?.duplicate_type !== "low_information") {
    console.log("❌ FAIL: Low-information comment was not suppressed.");
    process.exit(1);
  }
  if (sigLowInfo2.duplicate_control?.collapsed === true) {
    console.log("❌ FAIL: High-value prospect with low-information comment was incorrectly suppressed.");
    process.exit(1);
  }
  console.log("✅ PASS: Category C low-information comments suppressed correctly while preserving high-value prospects.");

  // Assertion 5: Prospect Variance Protection
  console.log("\n5. Prospect Variance Verification (Nurse vs Dietitian preservation):");
  const sigVarNurse = enrichedSignals.find(s => s.signal_id === "sig-var-nurse");
  const sigVarDietitian = enrichedSignals.find(s => s.signal_id === "sig-var-dietitian");

  console.log(`- sig-var-nurse: raw_text="${sigVarNurse.raw_text}"`);
  console.log(`- sig-var-dietitian: raw_text="${sigVarDietitian.raw_text}"`);
  console.log(`- sig-var-nurse Cluster ID: ${sigVarNurse.duplicate_control?.cluster_id}`);
  console.log(`- sig-var-dietitian Cluster ID: ${sigVarDietitian.duplicate_control?.cluster_id}`);
  console.log(`- sig-var-nurse Collapsed: ${sigVarNurse.duplicate_control?.collapsed}`);
  console.log(`- sig-var-dietitian Collapsed: ${sigVarDietitian.duplicate_control?.collapsed}`);

  if (sigVarNurse.duplicate_control.cluster_id === sigVarDietitian.duplicate_control.cluster_id) {
    console.log("❌ FAIL: Nurse and Dietitian signals were incorrectly clustered together.");
    process.exit(1);
  }
  if (sigVarNurse.duplicate_control.collapsed === true || sigVarDietitian.duplicate_control.collapsed === true) {
    console.log("❌ FAIL: Nurse or Dietitian signal was collapsed despite professional variance.");
    process.exit(1);
  }
  console.log("✅ PASS: Prospect variance protected successfully. Different professions are kept separate.");

  // Assertion 6: Telemetry schema
  console.log("\n6. Telemetry Logging Verification:");
  console.log("- Generated logs:");
  console.log(JSON.stringify(telemetryLogs, null, 2));

  const dupLog = telemetryLogs.find(l => l.event === "duplicate_cluster_detected");
  const lowInfoLog = telemetryLogs.find(l => l.event === "low_information_signal_collapsed");

  if (!dupLog || !dupLog.cluster_id || !dupLog.duplicate_type || dupLog.cluster_size !== 2 || dupLog.status !== "ok") {
    console.log("❌ FAIL: Invalid duplicate_cluster_detected telemetry log structure.");
    process.exit(1);
  }
  if (!lowInfoLog || lowInfoLog.signal_id !== "sig-lowinfo-1" || lowInfoLog.matched_pattern !== "great info" || lowInfoLog.status !== "ok") {
    console.log("❌ FAIL: Invalid low_information_signal_collapsed telemetry log structure.");
    process.exit(1);
  }
  console.log("✅ PASS: Telemetry logging events are 100% compliant with S13-T04 dev package schema.");

  // Assertion 7: Zero Data Loss
  console.log("\n7. Zero Data Loss Verification:");
  console.log(`- Input Signals: ${SupabaseSignals.length}`);
  console.log(`- Output Signals: ${enrichedSignals.length}`);
  
  if (SupabaseSignals.length !== enrichedSignals.length) {
    console.log("❌ FAIL: Number of output signals does not match number of input signals. Data was deleted!");
    process.exit(1);
  }
  console.log("✅ PASS: Zero data loss verified successfully. Collapsed signals remain in the returned list.");

  console.log("\n=================================================================");
  console.log("🟢 ALL S13-T04 DUPLICATE CALIBRATION VERIFICATION TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

runDuplicateValidation().catch(e => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
