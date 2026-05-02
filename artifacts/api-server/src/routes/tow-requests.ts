import { Router } from "express";
import { store } from "../lib/store";
import { getIO } from "../lib/socket";

const router = Router();

router.post("/tow-requests", (req, res) => {
  const { userId, userName, userPhone, towType, pickupLocation, pickupAddress, dropoffAddress, vehicleDetails } = req.body;

  if (!userId || !userName || !userPhone || !towType || !pickupLocation || !pickupAddress || !vehicleDetails) {
    res.status(400).json({ error: "validation_error", message: "Missing required fields" });
    return;
  }

  const request = store.createTowRequest({
    userId,
    userName,
    userPhone,
    towType,
    status: "pending",
    pickupLocation,
    pickupAddress,
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

router.get("/tow-requests", (req, res) => {
  const { userId, driverId, status } = req.query;
  let results = Array.from(store.towRequests.values());

  if (userId) results = results.filter((r) => r.userId === userId);
  if (driverId) results = results.filter((r) => r.driverId === driverId);
  if (status) results = results.filter((r) => r.status === status);

  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(results);
});

router.get("/tow-requests/:id", (req, res) => {
  const request = store.towRequests.get(req.params.id);
  if (!request) {
    res.status(404).json({ error: "not_found", message: "Request not found" });
    return;
  }
  res.json(request);
});

router.patch("/tow-requests/:id", (req, res) => {
  const { status, driverId, driverLocation, estimatedArrival } = req.body;
  const updated = store.updateTowRequest(req.params.id, {
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
