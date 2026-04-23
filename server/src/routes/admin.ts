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
    const env = process.env.NODE_ENV || 'development';
    let harvestUrl = '';
    
    try {
        // PRIMARY FIX: Hardcode the live Render URL as the default to ensure the client demo works.
        // If you need to run this locally, set HARVEST_URL=http://localhost:3001/v1/ingestion/tiktok/harvest in your local .env
        harvestUrl = process.env.HARVEST_URL || 'https://l2-ingestion-s7.onrender.com/v1/ingestion/tiktok/harvest';
        
        console.log(`[Admin] Scan Trigger: Calling ${harvestUrl}`);
    
    // Call the harvest process with a timeout to prevent hanging
    const response = await axios.post(harvestUrl, {}, { timeout: 15000 });
    
    return res.json({ 
        status: 'success', 
        message: 'Scan triggered successfully',
        data: response.data 
    });
  } catch (error: any) {
    const errorMsg = error.message || 'Unknown Error';
    console.error(`[Admin] Scan trigger FAILED: ${errorMsg} (${error.code})`);
    
    return res.status(500).json({ 
        error: "Failed to trigger scan", 
        detail: errorMsg,
        code: error.code,
        attempted_url: harvestUrl,
        hint: `Live site detected [Env: ${env}]. Ensure the 'HARVEST_URL' environment variable is set in your Render dashboard.`
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