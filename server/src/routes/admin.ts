import { Router, Request, Response } from "express";
import axios from "axios";
import Signal from "../models/Signal.js";
import fs from "fs";
import path from "path";
import { supabase } from "../lib/supabase.js";

const router = Router();

/**
 * HELPER: Validation & Persistence Logic
 * Adheres to T03.x and S12-P0 guards.
 */
async function saveValidSignal(signal: any) {
    const s = signal.structured_post?.data || signal.structured_post;
    if (!s) return;

    const sourceUrl = s.source?.source_url || "";
    const username = s.source?.username || "";

    // 1. Source Validity Guards (S12-P0)
    const isInvalid = !sourceUrl || 
                      !sourceUrl.startsWith('http') ||
                      username.toLowerCase() === 'unknown' ||
                      username.toLowerCase().includes('synthetic') ||
                      sourceUrl.toLowerCase().includes('@unknown') ||
                      sourceUrl.toLowerCase().includes('synthetic_user');

    if (isInvalid) {
        console.log(JSON.stringify({
            event: "signal_persistence_rejected_invalid_source",
            signal_id: signal.signal_id,
            reason: "invalid_or_synthetic_source",
            status: "rejected"
        }));
        return;
    }

    // 2. Exact Deduplication & Persistence (S12-P0)
    const { error } = await supabase
        .from('signals')
        .insert({
            signal_id: signal.signal_id,
            source_url: sourceUrl,
            platform: s.source?.platform || 'unknown',
            username: username,
            author_id: s.source?.author_id,
            raw_text: s.raw_text,
            structured_post: s,
            priority_tier: s.priority_tier,
            signal_score: s.classification?.signal_score,
            governance_route: s.classification?.primary_category,
            status: 'active'
        });

    if (error) {
        if (error.code === '23505') { // Unique constraint violation
            console.log(JSON.stringify({
                event: "signal_persistence_skipped_duplicate",
                source_url: sourceUrl,
                reason: "duplicate_source_url",
                status: "skipped"
            }));
        } else {
            console.error('[Supabase] Insert error:', error.message);
        }
    } else {
        console.log(JSON.stringify({
            event: "signal_persisted",
            signal_id: signal.signal_id,
            source_url: sourceUrl,
            status: "ok"
        }));
    }
}

/**
 * GET /admin/governance/signals
 * Reads from Supabase with fallback to local logs for maximum stability.
 */
router.get("/governance/signals", async (req: Request, res: Response) => {
  try {
    // Attempt Supabase read
    const { data, error } = await supabase
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) throw error;

    if (data && data.length > 0) {
        const signals = data.map(row => ({
            signal_id: row.signal_id,
            correlation_id: row.signal_id,
            timestamp: row.created_at,
            structured_post: row.structured_post
        }));
        return res.json(signals);
    }
    
    // Fallback if Supabase is empty
    throw new Error("Supabase empty, falling back to logs");

  } catch (error) {
    console.warn("[Admin] Supabase read failed/empty, falling back to ingestion logs.");
    
    // Recovery path: Read from l2_logs.txt
    try {
        const logPath = process.env.L2_LOG_PATH || path.resolve(process.cwd(), "..", "l2_logs.txt");
        if (fs.existsSync(logPath)) {
            const content = fs.readFileSync(logPath, "utf8");
            const lines = content.split("\n").filter(l => l.trim().length > 0);
            
            const signals = lines.map(line => {
                try {
                    const entry = JSON.parse(line);
                    return {
                        signal_id: entry.signal_id,
                        correlation_id: entry.correlation_id || entry.signal_id,
                        timestamp: entry.timestamp,
                        structured_post: entry.structured_post?.data || entry.structured_post
                    };
                } catch(e) { return null; }
            }).filter(Boolean).reverse().slice(0, 50);
            
            return res.json(signals);
        }
    } catch (logError) {
        console.error("[Admin] Critical: Both Supabase and Log fallback failed.");
    }
    
    return res.json([]); // Return empty rather than 500
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
 * POST /admin/signals
 * Receives a processed signal and stores it in Supabase + Log.
 */
router.post("/signals", async (req: Request, res: Response) => {
  try {
    const signalData = req.body;
    if (!signalData.signal_id) {
      return res.status(400).json({ error: "Missing signal_id" });
    }

    console.log(`[Admin] PROCESSING SIGNAL: ${signalData.signal_id}`);

    // 1. Persistence to Supabase (S12-P0) - NON-BLOCKING
    try {
        await saveValidSignal(signalData);
    } catch (dbError) {
        console.error("[Supabase] Persistence failed, but continuing to log file:", dbError);
    }

    // 2. Persistence to log file (Fallback/Observability)
    const logPath = process.env.L2_LOG_PATH || path.resolve(process.cwd(), "..", "l2_logs.txt");
    const entry = {
        event: "signal_lifecycle_report",
        timestamp: new Date().toISOString(),
        ...signalData
    };
    fs.appendFileSync(logPath, JSON.stringify(entry) + "\n");

    return res.status(201).json({ success: true, message: "Signal processed and persisted" });
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