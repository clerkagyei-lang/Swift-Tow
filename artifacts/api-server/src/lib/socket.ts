import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { logger } from "./logger";
import { store } from "./store";

const TOW_PRICING: Record<string, { ratePerKm: number; minFare: number }> = {
  flatbed:    { ratePerKm: 20, minFare: 30 },
  hook_chain: { ratePerKm: 15, minFare: 25 },
  repair:     { ratePerKm: 0,  minFare: 80 },
};

function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function computeFare(
  pickup: { latitude: number; longitude: number },
  dropoff: { latitude: number; longitude: number },
  towType = "flatbed"
): number {
  const { ratePerKm, minFare } = TOW_PRICING[towType] ?? TOW_PRICING.flatbed;
  if (ratePerKm === 0) return minFare;
  const distKm = haversineKm(pickup.latitude, pickup.longitude, dropoff.latitude, dropoff.longitude);
  return Math.max(minFare, Math.round(distKm * ratePerKm * 100) / 100);
}

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    path: "/api/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on("driver:join", (driverId: string) => {
      socket.join(`driver:${driverId}`);
      socket.data.driverId = driverId;
      logger.info({ driverId }, "Driver joined");
    });

    socket.on("user:join", (userId: string) => {
      socket.join(`user:${userId}`);
      socket.data.userId = userId;
      logger.info({ userId }, "User joined room");
    });

    socket.on("driver:location", ({ driverId, location }: { driverId: string; location: { latitude: number; longitude: number } }) => {
      // Update in-memory location cache (fast path — no DB write per GPS tick)
      store.updateDriverLocationCache(driverId, location);
      io?.emit("driver:location:update", { driverId, location });
    });

    socket.on("request:new", async (requestId: string) => {
      const req = await store.getTowRequestById(requestId);
      if (req) {
        io?.emit("request:incoming", req);
        logger.info({ requestId }, "New tow request broadcast");
      }
    });

    socket.on("request:accept", async ({ requestId, driverId }: { requestId: string; driverId: string }) => {
      const req = await store.updateTowRequest(requestId, {
        status: "accepted",
        driverId,
        estimatedArrival: Math.floor(Math.random() * 10) + 5,
      });
      if (req) {
        io?.to(`user:${req.userId}`).emit("request:accepted", req);
        io?.emit("request:status:update", req);
      }
    });

    socket.on("request:complete", async ({ requestId }: { requestId: string }) => {
      const req = await store.getTowRequestById(requestId);
      if (!req || !req.driverId) return;

      const driver = await store.getDriverById(req.driverId);
      const dropoff = (req.dropoffLocation as any) ?? driver?.currentLocation ?? req.pickupLocation;
      const amount = computeFare(req.pickupLocation as any, dropoff, req.towType);

      const updated = await store.updateTowRequest(requestId, { status: "completed", amount });
      if (updated && updated.driverId) {
        const d = await store.getDriverById(updated.driverId);
        if (d) {
          await store.createTrip({
            towRequestId: requestId,
            userId: updated.userId,
            driverId: updated.driverId,
            driverName: d.name,
            pickupAddress: updated.pickupAddress,
            dropoffAddress: updated.dropoffAddress ?? null,
            vehicleDetails: updated.vehicleDetails,
            towType: updated.towType,
            amount,
            paymentMethod: null,
            paymentStatus: "pending",
            completedAt: new Date().toISOString(),
          });
          await store.updateDriver(updated.driverId, { activeJobId: null });
        }
        io?.to(`user:${updated.userId}`).emit("request:completed", { requestId, amount });
        io?.emit("request:status:update", updated);
        logger.info({
          requestId,
          amount,
          distKm: haversineKm(
            (updated.pickupLocation as any).latitude,
            (updated.pickupLocation as any).longitude,
            dropoff.latitude,
            dropoff.longitude
          ).toFixed(2),
        }, "Trip completed");
      }
    });

    socket.on("sos:driver", ({ driverId, location }: { driverId: string; location: { latitude: number; longitude: number } }) => {
      logger.warn({ driverId, location }, "Driver SOS triggered");
      io?.emit("sos:alert", { driverId, location, timestamp: new Date().toISOString() });
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Socket disconnected");
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}
