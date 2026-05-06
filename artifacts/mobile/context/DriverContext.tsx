import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { io, Socket } from "socket.io-client";
import * as Location from "expo-location";

export interface IncomingRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  towType: "flatbed" | "hook_chain" | "repair";
  pickupLocation: { latitude: number; longitude: number };
  pickupAddress: string;
  vehicleDetails: string;
  estimatedAmount: number;
}

export type TripStatus = "idle" | "accepted" | "in_progress" | "completed";

export interface ActiveTrip {
  requestId: string;
  userId: string;
  userName: string;
  userPhone: string;
  towType: "flatbed" | "hook_chain" | "repair";
  pickupLocation: { latitude: number; longitude: number };
  pickupAddress: string;
  vehicleDetails: string;
}

interface DriverContextType {
  isOnline: boolean;
  setOnline: (online: boolean) => Promise<void>;
  driverLocation: { latitude: number; longitude: number } | null;
  incomingRequest: IncomingRequest | null;
  tripStatus: TripStatus;
  activeTrip: ActiveTrip | null;
  earningsToday: number;
  acceptRequest: (requestId: string) => void;
  declineRequest: () => void;
  completeTrip: (amount: number) => void;
  socket: Socket | null;
}

const DriverContext = createContext<DriverContextType | null>(null);

const API_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? "localhost";

const TOW_AMOUNTS: Record<string, number> = {
  flatbed: 250,
  hook_chain: 150,
  repair: 100,
};

// Web starting position — near Labone, Accra
const WEB_START = { latitude: 5.614818, longitude: -0.205874 };

export function DriverProvider({
  driverId,
  children,
}: {
  driverId: string | null;
  children: React.ReactNode;
}) {
  const [isOnline, setIsOnline] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<IncomingRequest | null>(null);
  const [tripStatus, setTripStatus] = useState<TripStatus>("idle");
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [earningsToday, setEarningsToday] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  // Web simulation refs
  const webSimIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const webCurrentLocRef = useRef<{ latitude: number; longitude: number }>(WEB_START);
  const webTargetLocRef = useRef<{ latitude: number; longitude: number } | null>(null);

  // Refs so socket callbacks always read current values (avoid stale closures)
  const isOnlineRef = useRef(false);
  const tripStatusRef = useRef<TripStatus>("idle");
  const driverIdRef = useRef(driverId);

  useEffect(() => { isOnlineRef.current = isOnline; }, [isOnline]);
  useEffect(() => { tripStatusRef.current = tripStatus; }, [tripStatus]);
  useEffect(() => { driverIdRef.current = driverId; }, [driverId]);

  // ── Web simulation helpers ─────────────────────────────────────────────────

  const stopWebSim = useCallback(() => {
    if (webSimIntervalRef.current) {
      clearInterval(webSimIntervalRef.current);
      webSimIntervalRef.current = null;
    }
    webTargetLocRef.current = null;
  }, []);

  const startWebMovement = useCallback((
    start: { latitude: number; longitude: number },
    target: { latitude: number; longitude: number }
  ) => {
    stopWebSim();
    webCurrentLocRef.current = start;
    webTargetLocRef.current = target;

    webSimIntervalRef.current = setInterval(() => {
      const cur = webCurrentLocRef.current;
      const tgt = webTargetLocRef.current;
      const id = driverIdRef.current;
      if (!tgt || !id) return;

      // Move 18% of the remaining distance each tick — exponential ease-in
      const newLat = cur.latitude + (tgt.latitude - cur.latitude) * 0.18;
      const newLng = cur.longitude + (tgt.longitude - cur.longitude) * 0.18;
      const newLoc = { latitude: newLat, longitude: newLng };

      webCurrentLocRef.current = newLoc;
      setDriverLocation(newLoc);
      socketRef.current?.emit("driver:location", { driverId: id, location: newLoc });
    }, 2500);
  }, [stopWebSim]);

  // ── Socket setup ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!driverId) return;

    const socket = io(`https://${API_DOMAIN}`, {
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("driver:join", driverId);
    });

    socket.on("request:incoming", (req: any) => {
      if (tripStatusRef.current === "idle" && isOnlineRef.current) {
        setIncomingRequest({
          id: req.id,
          userId: req.userId,
          userName: req.userName,
          userPhone: req.userPhone,
          towType: req.towType,
          pickupLocation: req.pickupLocation,
          pickupAddress: req.pickupAddress,
          vehicleDetails: req.vehicleDetails,
          estimatedAmount: TOW_AMOUNTS[req.towType] ?? 200,
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [driverId]);

  // ── Location tracking ──────────────────────────────────────────────────────

  const startLocationTracking = useCallback(async () => {
    if (Platform.OS === "web") {
      // Emit starting location immediately so user map can see the driver
      webCurrentLocRef.current = WEB_START;
      setDriverLocation(WEB_START);
      socketRef.current?.emit("driver:location", { driverId, location: WEB_START });
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const loc = { latitude: current.coords.latitude, longitude: current.coords.longitude };
    setDriverLocation(loc);
    socketRef.current?.emit("driver:location", { driverId, location: loc });

    locationSubRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
      (pos) => {
        const newLoc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setDriverLocation(newLoc);
        socketRef.current?.emit("driver:location", { driverId, location: newLoc });
      }
    );
  }, [driverId]);

  const stopLocationTracking = useCallback(() => {
    locationSubRef.current?.remove();
    locationSubRef.current = null;
    stopWebSim();
  }, [stopWebSim]);

  // ── Driver actions ──────────────────────────────────────────────────────────

  const setOnline = useCallback(async (online: boolean) => {
    setIsOnline(online);
    if (online) {
      await startLocationTracking();
    } else {
      stopLocationTracking();
    }
    try {
      await fetch(`https://${API_DOMAIN}/api/drivers/${driverId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: online, currentLocation: webCurrentLocRef.current }),
      });
    } catch {}
  }, [driverId, startLocationTracking, stopLocationTracking]);

  const acceptRequest = useCallback((requestId: string) => {
    if (!incomingRequest || !driverId) return;
    socketRef.current?.emit("request:accept", { requestId, driverId });

    const trip: ActiveTrip = {
      requestId,
      userId: incomingRequest.userId,
      userName: incomingRequest.userName,
      userPhone: incomingRequest.userPhone,
      towType: incomingRequest.towType,
      pickupLocation: incomingRequest.pickupLocation,
      pickupAddress: incomingRequest.pickupAddress,
      vehicleDetails: incomingRequest.vehicleDetails,
    };

    setActiveTrip(trip);
    setTripStatus("accepted");
    setIncomingRequest(null);

    // On web: simulate the driver moving toward the pickup location
    if (Platform.OS === "web") {
      startWebMovement(webCurrentLocRef.current, incomingRequest.pickupLocation);
    }
  }, [incomingRequest, driverId, startWebMovement]);

  const declineRequest = useCallback(() => {
    setIncomingRequest(null);
  }, []);

  const completeTrip = useCallback((amount: number) => {
    if (!activeTrip) return;
    socketRef.current?.emit("request:complete", { requestId: activeTrip.requestId, amount });
    setEarningsToday((prev) => prev + amount);
    setTripStatus("completed");

    // Stop web movement simulation
    stopWebSim();

    setTimeout(() => {
      setTripStatus("idle");
      setActiveTrip(null);
    }, 3000);
  }, [activeTrip, stopWebSim]);

  return (
    <DriverContext.Provider
      value={{
        isOnline,
        setOnline,
        driverLocation,
        incomingRequest,
        tripStatus,
        activeTrip,
        earningsToday,
        acceptRequest,
        declineRequest,
        completeTrip,
        socket: socketRef.current,
      }}
    >
      {children}
    </DriverContext.Provider>
  );
}

export function useDriver() {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error("useDriver must be used inside DriverProvider");
  return ctx;
}
