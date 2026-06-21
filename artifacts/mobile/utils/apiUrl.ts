import { Platform } from "react-native";

export function getApiBase(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.origin;
  }
  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "localhost";
  return `https://${domain}`;
}
