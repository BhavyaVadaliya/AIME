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

    return res.json(signals || []);
  } catch (error) {
    console.error("Governance signals read error:", error);
    return res.status(500).json({ error: "Failed to read governance database" });
  }
});

/**
 * POST /admin/governance/scan
 * Utility patch to trigger the existing TikTok harvest process.
 * Reuses the existing ingestion service endpoint.
 */
router.post("/governance/scan", async (req: Request, res: Response) => {
    const isRender = !!process.env.RENDER;
    const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';

    
    // Discovery List: Try multiple hostnames and paths to be absolutely sure we connect
    const hostnames = isRender ? ['l2-ingestion', 'l2-ingestion-s7', 'aime-l2-ingestion', 'localhost'] : ['localhost'];
    const ports = ['3001', '10000', '80'];
    const paths = ['/v1/harvest', '/v1/ingestion/tiktok/harvest', '/harvest'];
    
    const urlsToTry: string[] = [];
    
    // 0. SPECIFIC PRODUCTION TARGETS (Highest Priority)
    urlsToTry.push(`https://l2-ingestion.onrender.com/v1/harvest`);
    urlsToTry.push(`https://l2-ingestion.onrender.com/harvest`);
    
    // 1. Internal hostnames first (preferred for Render efficiency)
    for (const h of hostnames) {
        for (const p of ports) {
            for (const path of paths) {
                urlsToTry.push(`http://${h}:${p}${path}`);
                if (p === '80') urlsToTry.push(`http://${h}${path}`);
            }
        }
    }
    
    // 2. Public URL variations (Derive from current request hostname)
    const currentHostname = req.hostname;
    if (currentHostname.includes('.onrender.com')) {
        const baseSlug = currentHostname.split('.')[0].replace('-core', '').replace('aime-', '');
        
        // Try multiple naming patterns common on Render
        const publicBases = [
            `https://${baseSlug}-l2-ingestion.onrender.com`,
            `https://l2-ingestion-${baseSlug}.onrender.com`,
            `https://${baseSlug}-l2.onrender.com`,
            `https://l2-${baseSlug}.onrender.com`
        ];

        for (const base of publicBases) {
            for (const path of paths) {
                urlsToTry.push(`${base}${path}`);
            }
        }
    }

    // 3. Fallback to common defaults if no match yet
    urlsToTry.push(`https://l2-ingestion.onrender.com/v1/harvest`);

    // 4. Environment variable override (Highest Priority if set)
    if (process.env.HARVEST_URL) {
        urlsToTry.unshift(process.env.HARVEST_URL);
    }

    let lastError: any = null;
    let successfulUrl = '';

    console.log(`[Admin] Starting Scan Discovery [Render: ${isRender}]. Host: ${currentHostname}. Candidates: ${urlsToTry.length}`);

    for (const url of urlsToTry) {
        // Skip local URLs if we are running on a live Render site (safety guard)
        if (isRender && url.includes('localhost') && !isLocal) continue;

        try {
            console.log(`[Admin] Attempting scan trigger: ${url}`);
            const response = await axios.get(url, { timeout: 60000 });


            
            // STRICT VALIDATION: Ensure we actually hit the L2 service and not a generic 200 page
            if (response.data && response.data.status === 'accepted') {
                successfulUrl = url;
                console.log(`[Admin] SCAN SUCCESS: Validated trigger via ${url}`);
                return res.json({ 
                    status: 'success', 
                    message: `Scan triggered successfully`,
                    attempted_url: url,
                    data: response.data 
                });
            } else {
                console.warn(`[Admin] URL ${url} returned 200 but invalid body:`, response.data);
                throw new Error("Invalid service response body");
            }
        } catch (error: any) {
            lastError = error;
            console.warn(`[Admin] Failed ${url}: ${error.message} (${error.response?.status || error.code})`);
            // If it's a 405 (Method Not Allowed), it might expect a POST
            if (error.response?.status === 405) {
                try {
                    console.log(`[Admin] 405 received. Retrying with POST: ${url}`);
                    const postResponse = await axios.post(url, {}, { timeout: 8000 });
                    
                    if (postResponse.data && postResponse.data.status === 'accepted') {
                        successfulUrl = url;
                        return res.json({ 
                            status: 'success', 
                            message: `Scan triggered successfully via POST`,
                            attempted_url: url,
                            data: postResponse.data 
                        });
                    }
                } catch (postError: any) {
                    console.warn(`[Admin] POST fallback also failed for ${url}`);
                }
            }
        }
    }

    // If we get here, all attempts failed
    const errorMsg = lastError?.message || 'All endpoints returned 404 or connection failed';
    console.error(`[Admin] ALL scan trigger attempts FAILED.`);
    
    return res.status(500).json({ 
        error: "Failed to trigger scan after discovery", 
        detail: errorMsg,
        last_attempted_url: urlsToTry[urlsToTry.length - 1],
        hint: `None of the following URLs worked: ${urlsToTry.join(', ')}. Ensure the L2 Ingestion service is running and has the harvest endpoint enabled.`
    });
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
 * GET /admin/persona-usage
 * Placeholder for persona usage stats.
 */
router.get("/persona-usage", (req: Request, res: Response) => {
  return res.json({
    personas: [],
  });
});

export default router;