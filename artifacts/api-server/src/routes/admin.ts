import { Router, type Request, type Response, type NextFunction } from "express";
import { store } from "../lib/store";
import { logger } from "../lib/logger";

const router = Router();

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req.query.userId ?? req.body?.userId) as string | undefined;
  if (userId) {
    const user = await store.getUserById(userId);
    if (user?.role === "admin") { next(); return; }
  }
  res.status(403).json({ error: "forbidden", message: "Admin access required" });
}

router.get("/admin/drivers", requireAdmin, async (req, res) => {
  const { status } = req.query;
  let driverList = await store.getDrivers();
  if (status) driverList = driverList.filter((d) => d.approvalStatus === status);
  const safe = driverList.map(({ password: _, ...d }) => d);
  res.json(safe);
});

router.patch("/admin/drivers/:id/approve", requireAdmin, async (req, res) => {
  const { note } = req.body;
  const updated = await store.updateDriver(req.params.id, {
    approvalStatus: "approved",
    approvalNote: note ?? null,
  });
  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Driver not found" });
    return;
  }
  logger.info({ driverId: req.params.id }, "Driver approved");
  const { password: _, ...safe } = updated;
  res.json(safe);
});

router.patch("/admin/drivers/:id/reject", requireAdmin, async (req, res) => {
  const { note } = req.body;
  const updated = await store.updateDriver(req.params.id, {
    approvalStatus: "suspended",
    approvalNote: note ?? "Application rejected",
  });
  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Driver not found" });
    return;
  }
  logger.info({ driverId: req.params.id }, "Driver rejected");
  const { password: _, ...safe } = updated;
  res.json(safe);
});

export default router;
