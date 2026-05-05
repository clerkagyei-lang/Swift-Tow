import { create } from "zustand";

interface AuthState {
  adminUserId: string | null;
  setAdminUserId: (id: string | null) => void;
  logout: () => void;
}

const getStoredUserId = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("adminUserId");
  }
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  adminUserId: getStoredUserId(),
  setAdminUserId: (id) => {
    if (id) {
      localStorage.setItem("adminUserId", id);
    } else {
      localStorage.removeItem("adminUserId");
    }
    set({ adminUserId: id });
  },
  logout: () => {
    localStorage.removeItem("adminUserId");
    set({ adminUserId: null });
  },
}));
