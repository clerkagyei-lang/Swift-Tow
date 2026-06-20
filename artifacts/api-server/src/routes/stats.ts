import { Router } from "express";
import { store } from "../lib/store";

const router = Router();

router.get("/stats", async (_req, res) => {
  const stats = await store.getStats();
  res.json(stats);
});

export default router;
