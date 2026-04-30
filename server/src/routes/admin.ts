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
    // ROBUST DETECTION: Determine if we are running locally or on Render
    const isLocal = req.hostname === 'localhost' || 
                    req.hostname === '127.0.0.1' || 
                    !req.hostname.includes('onrender.com');
    
    const isRender = !!process.env.RENDER;

    // Discovery List: Try multiple hostnames and paths to be absolutely sure we connect
    const hostnames = isRender ? ['l2-ingestion', 'l2-ingestion-s7', 'localhost'] : ['localhost'];
    const ports = ['3001'];
    const paths = ['/v1/harvest', '/v1/ingestion/tiktok/harvest', '/harvest'];
    
    // Also include the public URL as a last resort
    const publicBase = `https://l2-ingestion.onrender.com`;
    const liveCoreBase = `https://aime-0vwz.onrender.com`;

    const urlsToTry: string[] = [];
    
    // 1. Internal hostnames first (preferred)
    for (const h of hostnames) {
        for (const p of ports) {
            for (const path of paths) {
                urlsToTry.push(`http://${h}:${p}${path}`);
            }
        }
    }
    
    // 2. Public URL variations
    for (const path of paths) {
        urlsToTry.push(`${publicBase}${path}`);
        urlsToTry.push(`${liveCoreBase.replace('aime-0vwz', 'l2-ingestion')}${path}`);
    }

    // 3. Environment variable override
    if (process.env.HARVEST_URL) {
        urlsToTry.unshift(process.env.HARVEST_URL);
    }

    let lastError: any = null;
    let successfulUrl = '';

    console.log(`[Admin] Starting Scan Discovery [Render: ${isRender}]. Candidates: ${urlsToTry.length}`);

    for (const url of urlsToTry) {
        try {
            console.log(`[Admin] Attempting scan trigger: ${url}`);
            const response = await axios.get(url, { timeout: 8000 });
            
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
    // Basic validation
    if (!signalData.signal_id) {
      console.warn("[Admin] Received signal with missing ID:", signalData);
      return res.status(400).json({ error: "Missing signal_id" });
    }

    console.log(`[Admin] RECEIVED SIGNAL: ${signalData.signal_id} (${signalData.correlation_id})`);

    // Persist to log file so Dashboard Lite can see it (S11 Distributed Fix)
    const logPath = process.env.L2_LOG_PATH || path.resolve(process.cwd(), "..", "l2_logs.txt");
    const entry = {
        event: "signal_lifecycle_report",
        timestamp: new Date().toISOString(),
        ...signalData
    };
    fs.appendFileSync(logPath, JSON.stringify(entry) + "\n");

    return res.status(201).json({ success: true, message: "Signal logged to file" });
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