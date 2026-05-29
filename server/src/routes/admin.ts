import { Router, Request, Response } from "express";
import axios from "axios";
import Signal from "../models/Signal.js";
import fs from "fs";
import path from "path";
import { supabase } from "../lib/supabase.js";

const router = Router();

/**
 * GET /admin/governance/signals (S10-T15 Correction)
 * Read-only re-sourcing from ingestion logs.
 * Zero impact on ingestion runtime.
 */
router.get("/governance/signals", async (req: Request, res: Response) => {
  try {
    const { data: signals, error } = await supabase
      .from('signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    if (!signals || signals.length === 0) {
      return res.json([]);
    }

    // Helper functions for deterministic priority sorting
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

    // 1. Group signals by creator (handle changes/missing keys resolved)
    // Helper functions for duplicate control
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
        "clinical_advancement_intent",
        "commercial_intent_candidate",
        "commercial_intent_multi_signal_boost",
        "personal_exploration_candidate",
        "help_seeking_candidate",
        "multi_signal_exploration_boost"
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

    // Category C: Low Information Patterns (Legacy)
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
    for (const s of signals) {
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
            if (s.structured_post.data) {
              s.structured_post.data.low_intent_noise = metadata;
            }
          }
          
          // Append tag
          const tags = getContextTags(s);
          if (!tags.includes("low_intent_phrase_overridden")) {
            tags.push("low_intent_phrase_overridden");
          }
          if (s.context_tags) s.context_tags = tags;
          if (s.structured_post) {
            if (!s.structured_post.classification) s.structured_post.classification = {};
            s.structured_post.classification.context_tags = tags;
            if (s.structured_post.data) {
              if (!s.structured_post.data.classification) s.structured_post.data.classification = {};
              s.structured_post.data.classification.context_tags = tags;
            }
          }

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
            if (s.structured_post.data) {
              s.structured_post.data.low_intent_noise = metadata;
            }
          }

          // Append tag
          const tags = getContextTags(s);
          if (!tags.includes("low_intent_noise")) {
            tags.push("low_intent_noise");
          }
          if (s.context_tags) s.context_tags = tags;
          if (s.structured_post) {
            if (!s.structured_post.classification) s.structured_post.classification = {};
            s.structured_post.classification.context_tags = tags;
            if (s.structured_post.data) {
              if (!s.structured_post.data.classification) s.structured_post.data.classification = {};
              s.structured_post.data.classification.context_tags = tags;
            }
          }

          s.duplicate_control = {
            cluster_id: "low-intent-suppressed",
            duplicate_type: "low_intent_noise",
            is_cluster_representative: false,
            cluster_size: 1,
            collapsed: true
          };
          if (s.structured_post) {
            s.structured_post.duplicate_control = s.duplicate_control;
            if (s.structured_post.data) {
              s.structured_post.data.duplicate_control = s.duplicate_control;
            }
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
        // Fallback to legacy low information comment check
        const isLowInfo = LOW_INFO_PATTERNS.includes(norm);
        
        // Initialize default low_intent_noise metadata
        const metadata = {
          is_low_intent: false,
          low_intent_phrase_overridden: false
        };
        s.low_intent_noise = metadata;
        if (s.structured_post) {
          s.structured_post.low_intent_noise = metadata;
          if (s.structured_post.data) {
            s.structured_post.data.low_intent_noise = metadata;
          }
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
            if (s.structured_post.data) {
              s.structured_post.data.duplicate_control = s.duplicate_control;
            }
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
        if (s.structured_post) {
          s.structured_post.duplicate_control = s.duplicate_control;
          if (s.structured_post.data) {
            s.structured_post.data.duplicate_control = s.duplicate_control;
          }
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
          if (rep.structured_post.data) {
            rep.structured_post.data.duplicate_control = rep.duplicate_control;
          }
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
            if (s.structured_post.data) {
              s.structured_post.data.duplicate_control = s.duplicate_control;
            }
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

    // 4. S13-T03: Group signals by creator (re-calibrated)
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

    // Sort signals within each creator group by value precedence
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

        const sourceDistribution = {
          status,
          cluster_count: clusterCount,
          visibility_rank: rank,
          is_source_overflow: isOverflow
        };

        // Add distribution object to both root and structured_post
        s.source_distribution = sourceDistribution;
        if (s.structured_post) {
          s.structured_post.source_distribution = sourceDistribution;
          if (s.structured_post.data) {
            s.structured_post.data.source_distribution = sourceDistribution;
          }
        }

        enrichedSignals.push(s);
      }

      // S13-T03 Creator Concentration Log
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

    // 5. Emit all structured logs to console and l2_logs.txt
    for (const log of telemetryLogs) {
      console.log(JSON.stringify(log));
      try {
        const logPath = process.env.L2_LOG_PATH || path.resolve(process.cwd(), "..", "l2_logs.txt");
        fs.appendFileSync(logPath, JSON.stringify({
          timestamp: new Date().toISOString(),
          ...log
        }) + "\n");
      } catch (err) {
        // Ignore
      }
    }

    // 6. Final Sort: Visible first, then Collapsed Overflow; inside each, sort by created_at descending
    enrichedSignals.sort((a, b) => {
      const overA = a.source_distribution?.is_source_overflow ? 1 : 0;
      const overB = b.source_distribution?.is_source_overflow ? 1 : 0;
      if (overA !== overB) {
        return overA - overB;
      }
      
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return timeB - timeA;
    });

    return res.json(enrichedSignals);
  } catch (error) {
    console.error("Governance signals read error:", error);
    return res.status(500).json({ error: "Failed to read governance database" });
  }
});

/**
 * POST /admin/governance/scan
 * Directly triggers Apify TikTok scraper and persists up to 50 new signals to Supabase.
 * No dependency on the l2-ingestion service — self-contained.
 */
router.post("/governance/scan", async (req: Request, res: Response) => {
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (!apifyToken) {
        return res.status(500).json({ error: "APIFY_API_TOKEN not configured on server" });
    }

    // Top 5 most targeted hashtags — focused = better quality, fewer credits used
    const targetHashtags = ['rd2be', 'dieteticintern', 'registereddietitian', 'nutritioncertification', 'careertransition'];
    const excludedHashtags = new Set(['weightloss', 'fitnessmotivation', 'gymtok', 'mealprep', 'whatieatinaday', 'fatloss', 'bodybuilding']);
    const priorityPatterns = ['certification', 'internship', 'salary', 'income', 'rd exam', 'dietetic internship',
                              'how do i', 'worth it', 'enroll', 'credential', 'how can i', 'should i', 'cost', 'program'];

    try {
        console.log('[Scan] Triggering Apify TikTok harvest directly...');

        // Apify sync endpoint: runs actor, waits for completion, returns dataset items
        const actorId = process.env.TIKTOK_ACTOR || 'clockworks~tiktok-scraper';
        const apifyRes = await axios.post(
            `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}&format=json`,
            {
                hashtags: targetHashtags,
                resultsPerPage: 15,          // 15/hashtag × 5 hashtags ≈ 75 raw items
                shouldScrapeComments: false, // Credit optimization: skip comments
            },
            { timeout: 180000 } // 3 min max — Apify sync runs can take ~60-90s
        );

        const rawItems: any[] = Array.isArray(apifyRes.data) ? apifyRes.data : [];
        console.log(`[Scan] Apify returned ${rawItems.length} raw items`);

        // Dedupe by TikTok post ID
        const seenIds = new Set<string>();
        const uniqueItems = rawItems.filter(item => {
            const id = String(item.id || '');
            if (!id || seenIds.has(id)) return false;
            seenIds.add(id);
            return true;
        });

        let persisted = 0;
        let skipped = 0;

        for (const item of uniqueItems) {
            if (persisted >= 50) break;

            // 1. Language filter — English only
            const lang = (item.language || item.lang || '').toLowerCase();
            if (lang && lang !== 'en') { skipped++; continue; }

            // 2. Hashtag exclusion
            const itemTags: string[] = (Array.isArray(item.hashtags) ? item.hashtags : [])
                .map((h: any) => (typeof h === 'string' ? h : (h?.name || '')).toLowerCase())
                .filter(Boolean);
            if (itemTags.some(h => excludedHashtags.has(h))) { skipped++; continue; }

            // 3. Extract core fields
            const text: string = item.text || item.desc || '';
            if (!text.trim()) { skipped++; continue; }

            const author = item.authorMeta || item.author || {};
            const authorName: string = typeof author === 'string'
                ? author
                : (author.uniqueId || author.nickname || '');
            const authorId: string = typeof author === 'object'
                ? (author.id || author.secUid || '')
                : '';
            const sourceUrl: string = item.webVideoUrl || item.url || '';

            if (!sourceUrl || !authorName) { skipped++; continue; }
            if (authorName.toLowerCase().includes('synthetic') || authorName.toLowerCase().includes('unknown')) {
                skipped++; continue;
            }

            // 4. Quality scoring
            const lowerText = text.toLowerCase();
            const isPriority = priorityPatterns.some(p => lowerText.includes(p));
            const tier: string = isPriority ? 'HIGH' : ((item.diggCount || 0) > 100 ? 'MEDIUM' : 'LOW');
            const queue: string = isPriority ? 'higher_risk' : 'low_risk';
            const score: number = isPriority ? 8 : ((item.diggCount || 0) > 100 ? 5 : 3);
            const timestamp: string = item.createTime
                ? new Date(item.createTime * 1000).toISOString()
                : new Date().toISOString();

            const signalId = `tiktok-${item.id}-${Date.now().toString(36)}`;

            // 5. Persist to Supabase
            const { error: insertErr } = await supabase
                .from('signals')
                .insert({
                    signal_id: signalId,
                    source_url: sourceUrl,
                    platform: 'tiktok',
                    username: authorName,
                    author_id: authorId,
                    raw_text: text,
                    structured_post: {
                        raw_text: text,
                        classification: {
                            primary_category: 'PROFESSIONAL_PATHWAY',
                            signal_type: 'organic_post',
                            context_tags: itemTags
                        },
                        governance_route: { queue },
                        signal_score: { score },
                        priority_tier: tier,
                        source: {
                            platform: 'tiktok',
                            username: authorName,
                            author_id: authorId,
                            source_url: sourceUrl,
                            timestamp
                        }
                    },
                    priority_tier: tier,
                    signal_score: score,
                    governance_route: queue,
                    status: 'active'
                });

            if (insertErr) {
                if (insertErr.code === '23505') {
                    skipped++; // Duplicate source_url — expected, skip silently
                } else {
                    console.error(`[Scan] Insert error for ${signalId}:`, insertErr.message);
                }
            } else {
                persisted++;
                console.log(JSON.stringify({ event: 'signal_persisted', signal_id: signalId, tier, score, status: 'ok' }));
            }
        }

        console.log(`[Scan] Done. persisted=${persisted} skipped=${skipped} raw=${rawItems.length}`);

        return res.json({
            status: 'success',
            message: `Scan complete — ${persisted} new signals ingested.`,
            data: { batch_size: persisted, raw_fetched: rawItems.length, skipped }
        });

    } catch (error: any) {
        console.error('[Scan] Error:', error.message);
        return res.status(500).json({
            error: 'Scan failed',
            detail: error.message,
            code: error.response?.status || 'N/A'
        });
    }
});




/**
 * GET /admin/logs
 * Returns the list of recent signals from MongoDB.
 */
router.get("/logs", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = 50;
    
    const [items, total] = await Promise.all([
      Signal.find().sort({ ingested_at: -1 }).skip((page - 1) * pageSize).limit(pageSize),
      Signal.countDocuments()
    ]);

    return res.json({
      items,
      pagination: { page, pageSize, total },
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch logs" });
  }
});

/**
 * GET /admin/metrics
 * Returns real aggregation of signals in the last 24h.
 */
router.get("/metrics", async (req: Request, res: Response) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await Signal.countDocuments({ ingested_at: { $gte: last24h } });

    return res.json({
      signalsLast24h: count,
      commentsGenerated: 0, // Placeholder
      flaggedComments: 0,
      personasActive: 0,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to calculate metrics" });
  }
});

/**
 * POST /admin/signals
 * Receives a processed signal and stores it in MongoDB.
 * Called by the ingestion service.
 */
router.post("/signals", async (req: Request, res: Response) => {
  try {
    const signalData = req.body;
    
    // 1. Mandatory Signal ID
    if (!signalData.signal_id) {
      return res.status(400).json({ error: "Missing signal_id" });
    }

    // Extract structured post and unwrap double-nesting if present
    let structuredPost = signalData.structured_post?.data || signalData.structured_post;
    if (structuredPost?.structured_post) {
      structuredPost = structuredPost.structured_post;
    }

    const sourceUrl = structuredPost?.source?.source_url || signalData.source_url;
    const username = structuredPost?.source?.username || signalData.username || 'unknown';

    // 2. Source Validity Guards (T03.x Persistence Enforcement)
    const isSynthetic = (username.toLowerCase().includes('synthetic') || 
                        username.toLowerCase().includes('unknown') || 
                        (sourceUrl && (sourceUrl.toLowerCase().includes('@unknown') || sourceUrl.toLowerCase().includes('synthetic'))));

    if (!sourceUrl || isSynthetic) {
      console.log(JSON.stringify({
        event: "signal_persistence_rejected_invalid_source",
        signal_id: signalData.signal_id,
        reason: !sourceUrl ? "missing_source_url" : "invalid_or_synthetic_source",
        status: "rejected"
      }));
      return res.status(200).json({ success: false, message: "Signal rejected by source guard" });
    }

    // 3. Persist to Supabase (Minimal Dedupe via source_url)
    const { error: supabaseError } = await supabase
      .from('signals')
      .insert({
        signal_id: signalData.signal_id,
        source_url: sourceUrl,
        platform: structuredPost?.source?.platform || signalData.platform || 'tiktok',
        username: username,
        author_id: structuredPost?.source?.author_id || signalData.author_id,
        raw_text: structuredPost?.raw_text || signalData.raw_text || signalData.text || '',
        structured_post: structuredPost,
        priority_tier: structuredPost?.priority_tier || 'LOW',
        signal_score: structuredPost?.signal_score?.score || 0,
        governance_route: structuredPost?.governance_route?.queue || 'general',
        scan_id: signalData.scan_id || null,
        status: 'active'
      });


    if (supabaseError) {
      if (supabaseError.code === '23505') { // Unique violation
        console.log(JSON.stringify({
          event: "signal_persistence_skipped_duplicate",
          source_url: sourceUrl,
          reason: "duplicate_source_url",
          status: "skipped"
        }));
        return res.status(200).json({ success: true, message: "Duplicate signal skipped" });
      }
      throw supabaseError;
    }

    console.log(JSON.stringify({
      event: "signal_persisted",
      signal_id: signalData.signal_id,
      source_url: sourceUrl,
      status: "ok"
    }));

    // Maintain legacy log file for backup traceability
    const logPath = process.env.L2_LOG_PATH || path.resolve(process.cwd(), "..", "l2_logs.txt");
    fs.appendFileSync(logPath, JSON.stringify({
        event: "signal_lifecycle_report",
        timestamp: new Date().toISOString(),
        ...signalData
    }) + "\n");

    return res.status(201).json({ success: true, message: "Signal persisted to Supabase" });
  } catch (error) {
    console.error("Signal ingest error:", error);
    return res.status(500).json({ error: "Failed to store signal" });
  }
});

/**
 * POST /admin/governance/signals/:id/continuity
 * Save and persist Guided Workflow continuity metadata into Supabase jsonb.
 */
router.post("/governance/signals/:id/continuity", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const metadata = req.body;

    const { data: signal, error: fetchError } = await supabase
      .from('signals')
      .select('*')
      .eq('signal_id', id)
      .single();

    if (fetchError || !signal) {
      return res.status(404).json({ error: "Signal not found" });
    }

    const updatedStructuredPost = {
      ...signal.structured_post,
      workflow_continuity: metadata
    };

    const { error: updateError } = await supabase
      .from('signals')
      .update({ structured_post: updatedStructuredPost })
      .eq('signal_id', id);

    if (updateError) throw updateError;

    // Log telemetry
    const logObj = {
      event: "workflow_continuity_saved",
      signal_id: id,
      engagement_state: metadata.engagement_state,
      last_action: metadata.last_action,
      status: "ok"
    };
    console.log(JSON.stringify(logObj));

    // Maintain legacy log file for backup traceability
    const logPath = process.env.L2_LOG_PATH || path.resolve(process.cwd(), "..", "l2_logs.txt");
    fs.appendFileSync(logPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        ...logObj
    }) + "\n");

    return res.json({ success: true, metadata });
  } catch (error: any) {
    console.error("Workflow continuity save error:", error);
    return res.status(500).json({ error: "Failed to save workflow continuity data" });
  }
});

/**
 * GET /admin/persona-usage
 * Placeholder for persona usage stats.
 */
router.get("/persona-usage", (req: Request, res: Response) => {
  return res.json({
    personas: [],
  });
});

export default router;