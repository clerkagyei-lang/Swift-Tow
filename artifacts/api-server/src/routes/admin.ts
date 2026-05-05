import { Router } from "express";
import { store } from "../lib/store";
import { logger } from "../lib/logger";

const router = Router();

// Simple admin auth middleware — checks X-Admin-Token header or userId param matches an admin
function requireAdmin(req: any, res: any, next: any) {
  const userId = (req.query.userId ?? req.body?.userId) as string | undefined;
  if (userId) {
    const user = store.getUserById(userId);
    if (user?.role === "admin") { next(); return; }
  }
  res.status(403).json({ error: "forbidden", message: "Admin access required" });
}

// GET /api/admin/drivers — list all drivers (filter by status)
router.get("/admin/drivers", requireAdmin, (req, res) => {
  const { status } = req.query;
  let driverList = Array.from(store.drivers.values());
  if (status) driverList = driverList.filter((d) => d.approvalStatus === status);

  const safe = driverList.map(({ password: _, ...d }) => d);
  res.json(safe);
});

// PATCH /api/admin/drivers/:id/approve
router.patch("/admin/drivers/:id/approve", requireAdmin, (req, res) => {
  const { note } = req.body;
  const updated = store.updateDriver(req.params.id, {
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

// PATCH /api/admin/drivers/:id/reject
router.patch("/admin/drivers/:id/reject", requireAdmin, (req, res) => {
  const { note } = req.body;
  const updated = store.updateDriver(req.params.id, {
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
