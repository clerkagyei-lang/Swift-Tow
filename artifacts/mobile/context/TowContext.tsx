import React, { createContext, useContext, useEffect, useRef, useState } from "react";
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
}

const TowContext = createContext<TowContextType | null>(null);

const API_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? "localhost";

export function TowProvider({ userId, children }: { userId: string | null; children: React.ReactNode }) {
  const [activeRequest, setActiveRequest] = useState<TowRequest | null>(null);
  const [towStatus, setTowStatus] = useState<TowStatus>("idle");
  const [pendingPayment, setPendingPayment] = useState<{ requestId: string; amount: number } | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const socket = io(`https://${API_DOMAIN}`, { path: "/api/socket.io", transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("user:join", userId);
    });

    socket.on("request:accepted", (req: TowRequest) => {
      setActiveRequest(req);
      setTowStatus("accepted");
    });

    socket.on("request:completed", ({ requestId, amount }: { requestId: string; amount: number }) => {
      setTowStatus("completed");
      setPendingPayment({ requestId, amount });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  const clearPendingPayment = () => {
    setPendingPayment(null);
    setTowStatus("idle");
    setActiveRequest(null);
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
