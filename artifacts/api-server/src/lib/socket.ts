import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { logger } from "./logger";
import { store } from "./store";

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
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
      const driver = store.drivers.get(driverId);
      if (driver) {
        store.drivers.set(driverId, { ...driver, currentLocation: location });
        io?.emit("driver:location:update", { driverId, location });
      }
    });

    socket.on("request:new", (requestId: string) => {
      const req = store.towRequests.get(requestId);
      if (req) {
        io?.emit("request:incoming", req);
        logger.info({ requestId }, "New tow request broadcast");
      }
    });

    socket.on("request:accept", ({ requestId, driverId }: { requestId: string; driverId: string }) => {
      const req = store.updateTowRequest(requestId, {
        status: "accepted",
        driverId,
        estimatedArrival: Math.floor(Math.random() * 10) + 5,
      });
      if (req) {
        io?.to(`user:${req.userId}`).emit("request:accepted", req);
        io?.emit("request:status:update", req);
      }
    });

    socket.on("request:complete", ({ requestId, amount }: { requestId: string; amount: number }) => {
      const req = store.updateTowRequest(requestId, {
        status: "completed",
        amount,
      });
      if (req && req.driverId) {
        const driver = store.drivers.get(req.driverId);
        if (driver) {
          store.createTrip({
            towRequestId: requestId,
            userId: req.userId,
            driverId: req.driverId,
            driverName: driver.name,
            pickupAddress: req.pickupAddress,
            dropoffAddress: req.dropoffAddress,
            vehicleDetails: req.vehicleDetails,
            towType: req.towType,
            amount,
            paymentMethod: null,
            paymentStatus: "pending",
            completedAt: new Date().toISOString(),
          });
          store.drivers.set(req.driverId, { ...driver, activeJobId: null });
        }
        io?.to(`user:${req.userId}`).emit("request:completed", { requestId, amount });
        io?.emit("request:status:update", req);
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
