import { Router } from "express";
import { store } from "../lib/store";

const router = Router();

router.get("/trips", async (req, res) => {
  const { userId } = req.query;
  if (!userId || typeof userId !== "string") {
    res.status(400).json({ error: "validation_error", message: "userId required" });
    return;
  }
  const results = await store.getTripsByUser(userId);
  res.json(results);
});

export default router;
