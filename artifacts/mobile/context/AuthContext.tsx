import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

const API_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? "swift-tow-truck-api-server.vercel.app";
setBaseUrl(`https://${API_DOMAIN}`);

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "user" | "driver" | "admin";
  avatarUrl: string | null;
  createdAt: string;
  approvalStatus?: "pending" | "approved" | "suspended";
  vehicleType?: string;
  vehiclePlate?: string;
  isOnline?: boolean;
  rating?: number;
  totalTrips?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  return SecureStore.setItemAsync(key, value);
}

async function secureDel(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  return SecureStore.deleteItemAsync(key);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedToken = await secureGet("auth_token");
      const storedUser = await secureGet("auth_user");
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        setToken(storedToken);
        setUser(parsedUser);
        setAuthTokenGetter(() => storedToken);
      }
      setIsLoading(false);
    })();
  }, []);

  const login = async (newToken: string, newUser: User) => {
    await secureSet("auth_token", newToken);
    await secureSet("auth_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setAuthTokenGetter(() => newToken);
  };

  const logout = async () => {
    await secureDel("auth_token");
    await secureDel("auth_user");
    setToken(null);
    setUser(null);
    setAuthTokenGetter(() => null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    secureSet("auth_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
