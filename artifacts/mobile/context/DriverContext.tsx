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
  dropoffLocation: { latitude: number; longitude: number } | null;
  dropoffAddress: string | null;
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
  dropoffLocation: { latitude: number; longitude: number } | null;
  dropoffAddress: string | null;
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
  completeTrip: () => void;
  socket: Socket | null;
}

const DriverContext = createContext<DriverContextType | null>(null);

const API_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? "swifttowtruck-api-server.up.railway.app";

const RATE_PER_KM = 20;   // GHS 10 per 0.5 km = GHS 20 per km
const MIN_FARE = 10;       // minimum fare: GHS 10 (covers first 0.5 km)

export function haversineKm(
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

export function computeFare(
  pickup: { latitude: number; longitude: number },
  dropoff: { latitude: number; longitude: number }
): number {
  const distKm = haversineKm(pickup.latitude, pickup.longitude, dropoff.latitude, dropoff.longitude);
  return Math.max(MIN_FARE, Math.round(distKm * RATE_PER_KM * 100) / 100);
}

const TOW_ESTIMATED_AMOUNTS: Record<string, number> = {
  flatbed: 250,
  hook_chain: 150,
  repair: 100,
};

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

  // Refs so socket callbacks always read the latest values (avoid stale closures)
  const isOnlineRef = useRef(false);
  const tripStatusRef = useRef<TripStatus>("idle");

  useEffect(() => { isOnlineRef.current = isOnline; }, [isOnline]);
  useEffect(() => { tripStatusRef.current = tripStatus; }, [tripStatus]);

  useEffect(() => {
    if (!driverId) return;

    const socketUrl = Platform.OS === "web" && typeof window !== "undefined"
      ? window.location.origin
      : `https://${API_DOMAIN}`;
    const socket = io(socketUrl, {
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("driver:join", driverId);
    });

    socket.on("request:incoming", (req: any) => {
      // Use refs so we always see the current online/trip state, not stale closure values
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
          estimatedAmount: TOW_ESTIMATED_AMOUNTS[req.towType] ?? 200,
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [driverId]);

  const startLocationTracking = useCallback(async () => {
    if (Platform.OS === "web") {
      const loc = { latitude: 5.614818, longitude: -0.205874 };
      setDriverLocation(loc);
      return;
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const loc = { latitude: current.coords.latitude, longitude: current.coords.longitude };
    setDriverLocation(loc);

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
  }, []);

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
        body: JSON.stringify({ isOnline: online, currentLocation: driverLocation }),
      });
    } catch {}
  }, [driverId, driverLocation, startLocationTracking, stopLocationTracking]);

  const acceptRequest = useCallback((requestId: string) => {
    if (!incomingRequest || !driverId) return;
    socketRef.current?.emit("request:accept", { requestId, driverId });
    setActiveTrip({
      requestId,
      userId: incomingRequest.userId,
      userName: incomingRequest.userName,
      userPhone: incomingRequest.userPhone,
      towType: incomingRequest.towType,
      pickupLocation: incomingRequest.pickupLocation,
      pickupAddress: incomingRequest.pickupAddress,
      dropoffLocation: incomingRequest.dropoffLocation ?? null,
      dropoffAddress: incomingRequest.dropoffAddress ?? null,
      vehicleDetails: incomingRequest.vehicleDetails,
    });
    setTripStatus("accepted");
    setIncomingRequest(null);
  }, [incomingRequest, driverId]);

  const declineRequest = useCallback(() => {
    setIncomingRequest(null);
  }, []);

  const completeTrip = useCallback(() => {
    if (!activeTrip) return;
    const dropoff = activeTrip.dropoffLocation ?? driverLocation ?? activeTrip.pickupLocation;
    const amount = computeFare(activeTrip.pickupLocation, dropoff);
    socketRef.current?.emit("request:complete", { requestId: activeTrip.requestId, amount });
    setEarningsToday((prev) => prev + amount);
    setTripStatus("completed");
    setTimeout(() => {
      setTripStatus("idle");
      setActiveTrip(null);
    }, 3000);
  }, [activeTrip, driverLocation]);

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
