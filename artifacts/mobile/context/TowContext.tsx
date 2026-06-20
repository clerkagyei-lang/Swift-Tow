import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { io, Socket } from "socket.io-client";

export type TowStatus = "idle" | "searching" | "accepted" | "in_progress" | "completed";

export interface TowRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  towType: "flatbed" | "hook_chain" | "repair";
  status: string;
  pickupLocation: { latitude: number; longitude: number };
  pickupAddress: string;
  dropoffAddress: string | null;
  vehicleDetails: string;
  driverId: string | null;
  estimatedArrival: number | null;
  amount: number | null;
  createdAt: string;
  updatedAt: string;
}

interface TowContextType {
  activeRequest: TowRequest | null;
  towStatus: TowStatus;
  setTowStatus: (status: TowStatus) => void;
  setActiveRequest: (req: TowRequest | null) => void;
  socket: Socket | null;
  pendingPayment: { requestId: string; amount: number } | null;
  clearPendingPayment: () => void;
  driverLocation: { latitude: number; longitude: number } | null;
  cancelRequest: () => Promise<void>;
}

const TowContext = createContext<TowContextType | null>(null);

const API_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? "localhost";

export function TowProvider({ userId, children }: { userId: string | null; children: React.ReactNode }) {
  const [activeRequest, setActiveRequest] = useState<TowRequest | null>(null);
  const [towStatus, setTowStatus] = useState<TowStatus>("idle");
  const [pendingPayment, setPendingPayment] = useState<{ requestId: string; amount: number } | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeRequestRef = useRef<TowRequest | null>(null);
  const towStatusRef = useRef<TowStatus>("idle");

  useEffect(() => { activeRequestRef.current = activeRequest; }, [activeRequest]);
  useEffect(() => { towStatusRef.current = towStatus; }, [towStatus]);

  useEffect(() => {
    if (!userId) return;

    const socketUrl = Platform.OS === "web" && typeof window !== "undefined"
      ? window.location.origin
      : `https://${API_DOMAIN}`;
    const socket = io(socketUrl, {
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("user:join", userId);
    });

    socket.on("request:accepted", (req: TowRequest) => {
      setActiveRequest(req);
      setTowStatus("accepted");
    });

    socket.on("driver:location:update", ({ driverId, location }: { driverId: string; location: { latitude: number; longitude: number } }) => {
      const req = activeRequestRef.current;
      const status = towStatusRef.current;
      if (req?.driverId === driverId || status === "accepted" || status === "in_progress") {
        setDriverLocation(location);
      }
    });

    socket.on("request:completed", ({ requestId, amount }: { requestId: string; amount: number }) => {
      setTowStatus("completed");
      setPendingPayment({ requestId, amount });
      setDriverLocation(null);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  const cancelRequest = async () => {
    const req = activeRequestRef.current;
    if (req) {
      try {
        await fetch(`https://${API_DOMAIN}/api/tow-requests/${req.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled" }),
        });
      } catch {}
    }
    setTowStatus("idle");
    setActiveRequest(null);
    setDriverLocation(null);
  };

  const clearPendingPayment = () => {
    setPendingPayment(null);
    setTowStatus("idle");
    setActiveRequest(null);
    setDriverLocation(null);
  };

  return (
    <TowContext.Provider
      value={{
        activeRequest,
        towStatus,
        setTowStatus,
        setActiveRequest,
        socket: socketRef.current,
        pendingPayment,
        clearPendingPayment,
        driverLocation,
        cancelRequest,
      }}
    >
      {children}
    </TowContext.Provider>
  );
}

export function useTow() {
  const ctx = useContext(TowContext);
  if (!ctx) throw new Error("useTow must be used inside TowProvider");
  return ctx;
}
