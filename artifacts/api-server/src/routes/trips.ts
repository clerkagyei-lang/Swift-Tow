import { Router } from "express";
import { store } from "../lib/store";

const router = Router();

router.get("/trips", async (req, res) => {
  const { userId, driverId } = req.query;
  if (driverId && typeof driverId === "string") {
    const results = await store.getTripsByDriver(driverId);
    res.json(results);
    return;
  }
  if (!userId || typeof userId !== "string") {
    res.status(400).json({ error: "validation_error", message: "userId or driverId required" });
    return;
  }
  const results = await store.getTripsByUser(userId);
  res.json(results);
});

export default router;
