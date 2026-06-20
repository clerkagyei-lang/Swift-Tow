import { Router } from "express";
import { store } from "../lib/store";
import { randomUUID } from "crypto";

const router = Router();

router.post("/payments", async (req, res) => {
  const { tripId, amount, method } = req.body;

  if (!tripId || !amount || !method) {
    res.status(400).json({ error: "validation_error", message: "tripId, amount, and method required" });
    return;
  }

  const trip = await store.markPaymentPaid(tripId, method);
  if (!trip) {
    res.status(404).json({ error: "not_found", message: "Trip not found" });
    return;
  }

  res.json({
    success: true,
    transactionId: method !== "cash" ? randomUUID() : null,
    message: method === "cash" ? "Cash payment recorded" : `Payment of GHS ${amount} processed via ${method}`,
  });
});

export default router;
