import { Router } from "express";
import { store } from "../lib/store";
import { getIO } from "../lib/socket";

const router = Router();

router.post("/tow-requests", async (req, res) => {
  const { userId, userName, userPhone, towType, pickupLocation, pickupAddress, dropoffLocation, dropoffAddress, vehicleDetails } = req.body;

  if (!userId || !userName || !userPhone || !towType || !pickupLocation || !pickupAddress || !vehicleDetails) {
    res.status(400).json({ error: "validation_error", message: "Missing required fields" });
    return;
  }

  const request = await store.createTowRequest({
    userId,
    userName,
    userPhone,
    towType,
    status: "pending",
    pickupLocation,
    pickupAddress,
    dropoffLocation: dropoffLocation ?? null,
    dropoffAddress: dropoffAddress || null,
    vehicleDetails,
    driverId: null,
    estimatedArrival: null,
    amount: null,
  });

  const io = getIO();
  if (io) {
    io.emit("request:incoming", request);
  }

  res.status(201).json(request);
});

router.get("/tow-requests", async (req, res) => {
  const { userId, driverId, status } = req.query;
  const results = await store.getTowRequests({
    userId: userId as string | undefined,
    driverId: driverId as string | undefined,
    status: status as string | undefined,
  });
  res.json(results);
});

router.get("/tow-requests/:id", async (req, res) => {
  const request = await store.getTowRequestById(req.params.id);
  if (!request) {
    res.status(404).json({ error: "not_found", message: "Request not found" });
    return;
  }
  res.json(request);
});

router.patch("/tow-requests/:id", async (req, res) => {
  const { status, driverId, estimatedArrival } = req.body;
  const updated = await store.updateTowRequest(req.params.id, {
    status,
    driverId,
    estimatedArrival,
  });

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Request not found" });
    return;
  }

  const io = getIO();
  if (io) {
    io.emit("request:status:update", updated);
    if (status === "accepted" && updated.userId) {
      io.to(`user:${updated.userId}`).emit("request:accepted", updated);
    }
  }

  res.json(updated);
});

export default router;
