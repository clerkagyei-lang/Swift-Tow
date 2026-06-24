import { Router } from "express";
import { store } from "../lib/store";
import { logger } from "../lib/logger";

const router = Router();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = "https://api.paystack.co";

router.post("/payments/paystack/initialize", async (req, res) => {
  if (!PAYSTACK_SECRET) {
    res.status(503).json({ error: "paystack_not_configured", message: "Paystack secret key not set" });
    return;
  }

  const { towRequestId, amount, email } = req.body;
  if (!towRequestId || !amount || !email) {
    res.status(400).json({ error: "validation_error", message: "towRequestId, amount, and email are required" });
    return;
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100),
        currency: "GHS",
        reference: `swifttow-${towRequestId}-${Date.now()}`,
        metadata: { towRequestId },
      }),
    });

    const data = await response.json() as any;

    if (!data.status) {
      logger.error({ data }, "Paystack initialize failed");
      res.status(502).json({ error: "paystack_error", message: data.message ?? "Payment initialization failed" });
      return;
    }

    res.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (err) {
    logger.error({ err }, "Paystack initialize error");
    res.status(500).json({ error: "internal_error", message: "Failed to initialize payment" });
  }
});

router.post("/payments/paystack/verify", async (req, res) => {
  if (!PAYSTACK_SECRET) {
    res.status(503).json({ error: "paystack_not_configured", message: "Paystack secret key not set" });
    return;
  }

  const { reference, towRequestId, paymentMethod } = req.body;
  if (!reference || !towRequestId) {
    res.status(400).json({ error: "validation_error", message: "reference and towRequestId are required" });
    return;
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });

    const data = await response.json() as any;

    if (!data.status || data.data?.status !== "success") {
      res.status(402).json({ error: "payment_not_successful", message: "Payment not confirmed by Paystack" });
      return;
    }

    const trip = await store.markPaymentPaid(towRequestId, paymentMethod ?? "mtn_momo");
    if (!trip) {
      res.status(404).json({ error: "not_found", message: "Trip not found for this request" });
      return;
    }

    res.json({ success: true, transactionId: reference });
  } catch (err) {
    logger.error({ err }, "Paystack verify error");
    res.status(500).json({ error: "internal_error", message: "Failed to verify payment" });
  }
});

export default router;
