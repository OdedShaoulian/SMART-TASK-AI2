import { Router } from "express";

export const healthRouter = Router();

const handler = (_req: any, res: any) => {
  res.status(200).json({
    status: "ok",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

healthRouter.get("/health", handler);
healthRouter.get("/api/health", handler);
