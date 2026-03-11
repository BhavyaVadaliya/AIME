import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /admin/logs
 * Returns a placeholder paginated list of recent AI comments/signals.
 * Later: wire to real log storage.
 */
router.get("/logs", (req: Request, res: Response) => {
  // Placeholder response for now
  return res.json({
    items: [],
    pagination: { page: 1, pageSize: 50, total: 0 },
  });
});

/**
 * GET /admin/metrics
 * Returns placeholder metrics for dashboard charts.
 */
router.get("/metrics", (req: Request, res: Response) => {
  return res.json({
    signalsLast24h: 0,
    commentsGenerated: 0,
    flaggedComments: 0,
    personasActive: 0,
  });
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