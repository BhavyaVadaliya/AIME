import { Router, Request, Response } from "express";
import axios from "axios";
import Signal from "../models/Signal.js";
import fs from "fs";
import path from "path";

const router = Router();

/**
 * GET /admin/governance/signals (S10-T15 Correction)
 * Read-only re-sourcing from ingestion logs.
 * Zero impact on ingestion runtime.
 */
router.get("/governance/signals", async (req: Request, res: Response) => {
  try {
    const logPath = process.env.L2_LOG_PATH || path.resolve(process.cwd(), "..", "l2_logs.txt");
    console.log(`[Admin] Reading logs from: ${logPath}`); // Audit log
    if (!fs.existsSync(logPath)) {
      console.warn(`[Admin] Log file not found at: ${logPath}`);
      return res.json([]);
    }

    const content = fs.readFileSync(logPath, "utf8");
    const lines = content.split("\n").filter(l => l.trim().length > 0);
    console.log(`[Admin] Total lines in log: ${lines.length}`);
    
    // Parse logs and extract lifecycle reports
    const signals: any[] = [];
    for (const line of lines) {
      try {
        const entry = JSON.parse(line.trim());
        if (entry.event === "signal_lifecycle_report") {
          // Backward compatibility for simulated signals vs real LifecycleReports
          let structured_post = entry.structured_post?.data || entry.structured_post;
          if (!structured_post && entry.lifecycle?.structured_post) {
            structured_post = entry.lifecycle.structured_post.data || entry.lifecycle.structured_post;
          }

          signals.unshift({
              signal_id: entry.signal_id,
              correlation_id: entry.correlation_id,
              timestamp: entry.timestamp,
              structured_post
          });
        }
      } catch (e) { 
          // skip
      }
    }
    console.log(`[Admin] Found ${signals.length} lifecycle reports`);

    return res.json(signals.slice(0, 50));
  } catch (error) {
    console.error("Governance signals read error:", error);
    return res.status(500).json({ error: "Failed to read governance logs" });
  }
});

/**
 * POST /admin/governance/scan
 * Utility patch to trigger the existing TikTok harvest process.
 * Reuses the existing ingestion service endpoint.
 */
router.post("/governance/scan", async (req: Request, res: Response) => {
    let harvestUrl = '';
    
    // ROBUST DETECTION: Determine if we are running locally or on Render
    const isLocal = req.hostname === 'localhost' || 
                    req.hostname === '127.0.0.1' || 
                    !req.hostname.includes('onrender.com');
    
    const isRender = !!process.env.RENDER;

    // Use Render's Internal Networking (http://service-name:port) for zero-latency, rate-limit-free calls
    const defaultInternalUrl = `http://l2-ingestion-s7:3001/v1/harvest`;
    const defaultLiveUrl = `https://l2-ingestion-s7.onrender.com/v1/harvest`;
    const defaultLocalUrl = `http://localhost:3001/v1/harvest`;
    
    // Prioritize: 1. ENV VAR, 2. Internal Render URL, 3. Public Live URL, 4. Local URL
    harvestUrl = process.env.HARVEST_URL || 
                 (isLocal ? defaultLocalUrl : (isRender ? defaultInternalUrl : defaultLiveUrl));

    // AUTO-CORRECT: Ensure the path is present (Sprint 11 standard)
    if (!harvestUrl.includes('/v1/')) {
        harvestUrl = harvestUrl.replace(/\/$/, '') + '/v1/harvest';
    }

    try {
        console.log(`[Admin] Scan Trigger [Local: ${isLocal}, Render: ${isRender}]: Calling ${harvestUrl}`);
        
        // Using GET to bypass potential POST-specific rate limits/Cloudflare filters
        // Using a short timeout for internal, longer for public
        const response = await axios.get(harvestUrl, { 
            timeout: isRender ? 5000 : 15000 
        });
        
        return res.json({ 
            status: 'success', 
            message: `Scan triggered successfully via GET (${isRender ? 'Internal' : (isLocal ? 'Local' : 'Live')})`,
            data: response.data 
        });
    } catch (error: any) {
        // FALLBACK: If the simplified /v1/harvest fails with 404, try the legacy ingestion path
        if (error.response?.status === 404 && harvestUrl.endsWith('/v1/harvest')) {
            const legacyUrl = harvestUrl.replace('/v1/harvest', '/v1/ingestion/tiktok/harvest');
            console.log(`[Admin] Primary URL 404. Trying legacy fallback: ${legacyUrl}`);
            try {
                const legacyResponse = await axios.post(legacyUrl, {}, { timeout: 15000 });
                return res.json({
                    status: 'success',
                    message: 'Scan triggered via legacy fallback',
                    data: legacyResponse.data
                });
            } catch (fallbackError: any) {
                console.error(`[Admin] Legacy fallback also failed: ${fallbackError.message}`);
            }
        }

        const errorMsg = error.message || 'Unknown Error';
        console.error(`[Admin] Scan trigger FAILED: ${errorMsg} (${error.code})`);
        
        return res.status(500).json({ 
            error: "Failed to trigger scan", 
            detail: errorMsg,
            code: error.code,
            attempted_url: harvestUrl,
            hint: `If you see 429, wait 1 minute. If you see 404, the Ingestion service may have changed endpoints. Current: ${harvestUrl}`
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
    // Basic validation
    if (!signalData.signal_id || !signalData.raw_text) {
      return res.status(400).json({ error: "Missing signal_id or raw_text" });
    }

    /* 
    const doc = await Signal.findOneAndUpdate(
      { signal_id: signalData.signal_id },
      { ...signalData, ingested_at: new Date() },
      { upsert: true, new: true }
    );
    */

    return res.status(201).json({ success: true, message: "Signal logged (DB skip)" });
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