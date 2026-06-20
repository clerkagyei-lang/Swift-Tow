import { Router } from "express";
import { store } from "../lib/store";

const router = Router();

router.get("/drivers", async (req, res) => {
  const { online } = req.query;
  const filters = online !== undefined ? { online: online === "true" } : undefined;
  const results = await store.getDrivers(filters);
  res.json(results);
});

router.get("/drivers/:id", async (req, res) => {
  const driver = await store.getDriverById(req.params.id);
  if (!driver) {
    res.status(404).json({ error: "not_found", message: "Driver not found" });
    return;
  }
  res.json(driver);
});

router.patch("/drivers/:id/status", async (req, res) => {
  const { isOnline, currentLocation } = req.body;
  const driver = await store.getDriverById(req.params.id);
  if (!driver) {
    res.status(404).json({ error: "not_found", message: "Driver not found" });
    return;
  }
  const updated = await store.updateDriver(req.params.id, {
    isOnline,
    currentLocation: currentLocation ?? driver.currentLocation,
  });
  res.json(updated);
});

export default router;
