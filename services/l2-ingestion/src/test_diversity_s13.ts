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
  context_tags?: string[];
  structured_post?: any;
}

const mockSignals: MockSignal[] = [
  // Creator A (BurnoutNurse) - 5 signals
  {
    signal_id: "sig-a-1",
    username: "BurnoutNurse",
    author_id: "creator-a",
    source_url: "https://tiktok.com/@burnoutnurse/video/111",
    created_at: "2026-05-20T10:00:00.000Z",
    priority_tier: "LOW",
    signal_score: 3,
    context_tags: [],
  },
  {
    signal_id: "sig-a-2",
    username: "BurnoutNurse",
    author_id: "creator-a",
    source_url: "https://tiktok.com/@burnoutnurse/video/222",
    created_at: "2026-05-20T11:00:00.000Z",
    priority_tier: "MEDIUM",
    signal_score: 6,
    context_tags: ["prospect_candidate", "professional_identity_match"], // Prospect! Should be preserved first!
  },
  {
    signal_id: "sig-a-3",
    username: "BurnoutNurse",
    author_id: "creator-a",
    source_url: "https://tiktok.com/@burnoutnurse/video/333",
    created_at: "2026-05-20T12:00:00.000Z",
    priority_tier: "HIGH",
    signal_score: 9,
    context_tags: [],
  },
  {
    signal_id: "sig-a-4",
    username: "BurnoutNurse",
    author_id: "creator-a",
    source_url: "https://tiktok.com/@burnoutnurse/video/444",
    created_at: "2026-05-20T09:00:00.000Z",
    priority_tier: "MEDIUM",
    signal_score: 5,
    context_tags: [],
  },
  {
    signal_id: "sig-a-5",
    username: "BurnoutNurse",
    author_id: "creator-a",
    source_url: "https://tiktok.com/@burnoutnurse/video/111", // Exact duplicate URL of sig-a-1!
    created_at: "2026-05-20T13:00:00.000Z",
    priority_tier: "LOW",
    signal_score: 2,
    context_tags: [],
  },

  // Creator B (SideGigs) - 2 signals
  {
    signal_id: "sig-b-1",
    username: "SideGigs",
    author_id: "creator-b",
    source_url: "https://tiktok.com/@sidegigs/video/555",
    created_at: "2026-05-20T08:00:00.000Z",
    priority_tier: "LOW",
    signal_score: 2,
    context_tags: [],
  },
  {
    signal_id: "sig-b-2",
    username: "SideGigs",
    author_id: "creator-b",
    source_url: "https://tiktok.com/@sidegigs/video/666",
    created_at: "2026-05-20T09:30:00.000Z",
    priority_tier: "HIGH",
    signal_score: 8,
    context_tags: [],
  },

  // Creator C (OnlyOne) - 1 signal
  {
    signal_id: "sig-c-1",
    username: "OnlyOne",
    author_id: "creator-c",
    source_url: "https://tiktok.com/@onlyone/video/777",
    created_at: "2026-05-20T07:00:00.000Z",
    priority_tier: "MEDIUM",
    signal_score: 5,
    context_tags: [],
  }
];

// Wrap signals to simulate Supabase shape where structured_post has nested data
const SupabaseSignals = mockSignals.map(s => ({
  signal_id: s.signal_id,
  username: s.username,
  author_id: s.author_id,
  source_url: s.source_url,
  created_at: s.created_at,
  priority_tier: s.priority_tier,
  signal_score: s.signal_score,
  structured_post: {
    priority_tier: s.priority_tier,
    signal_score: { score: s.signal_score },
    classification: {
      primary_category: "UNCLASSIFIED",
      signal_type: "Content",
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

async function runDiversityValidation() {
  console.log("=================================================================");
  console.log("       AIME S13-T03 SIGNAL DIVERSITY CALIBRATION TEST SUITE       ");
  console.log("=================================================================");

  // 1. Group signals by creator
  interface CreatorGroup {
    username: string;
    author_id: string;
    signals: any[];
  }
  const groups: CreatorGroup[] = [];

  for (const s of SupabaseSignals) {
    let sp = s.structured_post;
    if (sp?.structured_post) sp = sp.structured_post;
    
    const username = (s.username || sp?.source?.username || '').trim().toLowerCase() || 'unknown';
    const authorId = (s.author_id || sp?.source?.author_id || '').trim().toLowerCase() || 'unknown';
    
    let found = groups.find(g => 
      (authorId !== 'unknown' && g.author_id === authorId) ||
      (username !== 'unknown' && g.username === username)
    );
    
    if (found) {
      if (found.author_id === 'unknown' && authorId !== 'unknown') {
        found.author_id = authorId;
      }
      if (found.username === 'unknown' && username !== 'unknown') {
        found.username = username;
      }
      found.signals.push(s);
    } else {
      groups.push({
        username,
        author_id: authorId,
        signals: [s]
      });
    }
  }

  // Verify group counts
  console.log(`\n1. Creator Grouping Verification:`);
  console.log(`- Total Groups Found: ${groups.length}`);
  if (groups.length !== 3) {
    console.log(`❌ FAIL: Expected 3 distinct creator groups, got ${groups.length}`);
    process.exit(1);
  }
  console.log(`✅ PASS: Correctly grouped signals into 3 unique creators.`);

  // 2. Sort signals within each creator group by value precedence
  for (const g of groups) {
    g.signals.sort((a, b) => {
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
  }

  // Verify Creator A Sorting Precedence:
  // sig-a-2 (Prospect, Medium, 6) -> Prospect comes first!
  // sig-a-3 (High, 9)
  // sig-a-4 (Medium, 5, 09:00:00)
  // sig-a-1 (Low, 3, 10:00:00)
  // sig-a-5 (Low, 2, 13:00:00)
  console.log(`\n2. Priority Value Preservation Sorting Verification (Creator A):`);
  const sortedA = groups.find(g => g.username === "burnoutnurse")?.signals || [];
  const expectedOrderA = ["sig-a-2", "sig-a-3", "sig-a-4", "sig-a-1", "sig-a-5"];
  console.log(`- Actual Sorted IDs: [${sortedA.map(s => s.signal_id).join(", ")}]`);
  
  for (let i = 0; i < expectedOrderA.length; i++) {
    if (sortedA[i].signal_id !== expectedOrderA[i]) {
      console.log(`❌ FAIL: Sorting mismatch at position ${i}. Expected ${expectedOrderA[i]}, got ${sortedA[i].signal_id}`);
      process.exit(1);
    }
  }
  console.log(`✅ PASS: Correctly preserved prospect first, then HIGH, then score, then timestamp.`);

  // 3. Process caps, duplicate URLs, and assign distribution metadata
  const maxVisibleCap = 3;
  const seenUrls = new Set<string>();
  const enrichedSignals: any[] = [];
  const telemetryLogs: any[] = [];

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

      if (isDuplicateUrl) {
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

    if (clusterCount > 1) {
      const creatorHandle = g.username !== 'unknown' ? `@${g.username}` : `unknown`;
      telemetryLogs.push({
        event: "source_concentration_detected",
        creator: creatorHandle,
        author_id: g.author_id,
        signal_count: clusterCount,
        visible_count: Math.min(clusterCount - overflowCount, maxVisibleCap),
        overflow_count: overflowCount,
        status: "ok"
      });
    }

    if (overflowCount > 0) {
      const creatorHandle = g.username !== 'unknown' ? `@${g.username}` : `unknown`;
      telemetryLogs.push({
        event: "source_overflow_collapsed",
        creator: creatorHandle,
        overflow_count: overflowCount,
        status: "ok"
      });
    }
  }

  // 4. Verify Caps and Metadata Output
  console.log(`\n3. Visibility Capping & Duplicate URL Handling Verification:`);
  const burnoutNurseGroup = enrichedSignals.filter(s => s.username === "BurnoutNurse");

  const sig_a_2 = burnoutNurseGroup.find(s => s.signal_id === "sig-a-2");
  const sig_a_3 = burnoutNurseGroup.find(s => s.signal_id === "sig-a-3");
  const sig_a_4 = burnoutNurseGroup.find(s => s.signal_id === "sig-a-4");
  const sig_a_1 = burnoutNurseGroup.find(s => s.signal_id === "sig-a-1");
  const sig_a_5 = burnoutNurseGroup.find(s => s.signal_id === "sig-a-5");

  console.log(`- sig-a-2 (Prospect): status=${sig_a_2?.source_distribution?.status}, rank=${sig_a_2?.source_distribution?.visibility_rank}, overflow=${sig_a_2?.source_distribution?.is_source_overflow}`);
  console.log(`- sig-a-1 (Low): status=${sig_a_1?.source_distribution?.status}, rank=${sig_a_1?.source_distribution?.visibility_rank}, overflow=${sig_a_1?.source_distribution?.is_source_overflow}`);
  console.log(`- sig-a-5 (Duplicate URL): status=${sig_a_5?.source_distribution?.status}, rank=${sig_a_5?.source_distribution?.visibility_rank}, overflow=${sig_a_5?.source_distribution?.is_source_overflow}`);

  if (sig_a_2?.source_distribution?.is_source_overflow !== false || sig_a_2?.source_distribution?.visibility_rank !== 1) {
    console.log(`❌ FAIL: High value prospect sig-a-2 should be rank 1 and visible.`);
    process.exit(1);
  }
  if (sig_a_1?.source_distribution?.is_source_overflow !== true || sig_a_1?.source_distribution?.visibility_rank !== 4) {
    console.log(`❌ FAIL: Over-cap signal sig-a-1 should be rank 4 and overflow.`);
    process.exit(1);
  }
  if (sig_a_5?.source_distribution?.is_source_overflow !== true || sig_a_5?.source_distribution?.visibility_rank !== 999) {
    console.log(`❌ FAIL: Duplicate URL signal sig-a-5 should be rank 999 and overflow.`);
    process.exit(1);
  }
  console.log(`✅ PASS: Correctly capped visible signals to 3 and flagged over-cap and exact URL duplicates.`);

  // 5. Verify Telemetry Logging Output
  console.log(`\n4. Telemetry Logging Verification:`);
  console.log(`- Generated Logs:`, JSON.stringify(telemetryLogs, null, 2));

  const concLog = telemetryLogs.find(l => l.event === "source_concentration_detected" && l.creator === "@burnoutnurse");
  const overflowLog = telemetryLogs.find(l => l.event === "source_overflow_collapsed" && l.creator === "@burnoutnurse");

  if (!concLog || concLog.signal_count !== 5 || concLog.visible_count !== 3 || concLog.overflow_count !== 2) {
    console.log(`❌ FAIL: Incorrect source_concentration_detected log schema or values.`);
    process.exit(1);
  }
  if (!overflowLog || overflowLog.overflow_count !== 2) {
    console.log(`❌ FAIL: Incorrect source_overflow_collapsed log schema or values.`);
    process.exit(1);
  }
  console.log(`✅ PASS: Log event schemas are exactly compliant with final dev package requirements.`);

  // 6. Zero Data Loss Verification
  console.log(`\n5. Zero Data Loss Verification:`);
  console.log(`- Raw Signals Count: ${SupabaseSignals.length}`);
  console.log(`- Enriched Signals Count: ${enrichedSignals.length}`);
  if (SupabaseSignals.length !== enrichedSignals.length) {
    console.log(`❌ FAIL: Enriched signals length ${enrichedSignals.length} does not match raw signals length ${SupabaseSignals.length}. Signals were deleted!`);
    process.exit(1);
  }
  console.log(`✅ PASS: No data deletion detected. All signals preserved.`);

  console.log(`\n=================================================================`);
  console.log("🟢 ALL S13-T03 DIVERSITY CALIBRATION VERIFICATION TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

runDiversityValidation().catch(e => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
