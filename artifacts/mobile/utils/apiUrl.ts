import { Platform } from "react-native";

export function getApiBase(): string {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location?.origin) {
      return window.location.origin;
    }
    return "";
  }
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain || domain === "undefined" || domain === "localhost") {
    return "";
  }
  return `https://${domain}`;
}
