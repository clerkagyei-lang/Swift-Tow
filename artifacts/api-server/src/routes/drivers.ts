import { Router } from "express";
import { store } from "../lib/store";

const router = Router();

router.get("/drivers", (req, res) => {
  const { online } = req.query;
  let results = Array.from(store.drivers.values());
  if (online !== undefined) {
    const isOnline = online === "true";
    results = results.filter((d) => d.isOnline === isOnline);
  }
  res.json(results);
});

router.get("/drivers/:id", (req, res) => {
  const driver = store.drivers.get(req.params.id);
  if (!driver) {
    res.status(404).json({ error: "not_found", message: "Driver not found" });
    return;
  }
  res.json(driver);
});

router.patch("/drivers/:id/status", (req, res) => {
  const { isOnline, currentLocation } = req.body;
  const driver = store.drivers.get(req.params.id);
  if (!driver) {
    res.status(404).json({ error: "not_found", message: "Driver not found" });
    return;
  }
  const updated = { ...driver, isOnline, currentLocation: currentLocation || driver.currentLocation };
  store.drivers.set(req.params.id, updated);
  res.json(updated);
});

export default router;
