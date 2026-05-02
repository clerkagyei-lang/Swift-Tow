import { Router } from "express";
import { store } from "../lib/store";

const router = Router();

router.get("/trips", (req, res) => {
  const { userId } = req.query;
  if (!userId || typeof userId !== "string") {
    res.status(400).json({ error: "validation_error", message: "userId required" });
    return;
  }
  const results = Array.from(store.trips.values())
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  res.json(results);
});

export default router;
