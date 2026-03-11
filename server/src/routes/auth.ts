import { Router, Request, Response } from "express";

const router = Router();

/**
 * Simple health check for OAuth module.
 * Used by CI/staging to confirm the auth stack is wired correctly.
 */
router.get("/health", (req: Request, res: Response) => {
  return res.status(200).json({
    status: "ok",
    module: "oauth",
    env: process.env.NODE_ENV || "unknown",
  });
});

export default router;