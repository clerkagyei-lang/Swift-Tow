import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { TowProvider } from "../providers/TowProvider";
import { DriverProvider } from "../providers/DriverProvider";

export default function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === "auth";
    const inDriver = segments[0] === "(driver)";
    const inTabs = segments[0] === "(tabs)";
    const inAdmin = segments[0] === "admin";
    const inPending = segments[1] === "pending-approval";

    // 1. If no user, must be in Auth
    if (!user) {
      if (!inAuth) router.replace("/auth/login" as any);
      return;
    }

    // 2. Safely access user properties
    const role = user?.role;
    const status = user?.approvalStatus;

    // 3. Handle Auth routes for logged-in users
    if (inAuth && !inPending) {
      if (role === "driver" && status === "pending") {
        router.replace("/auth/pending-approval" as any);
      } else if (role === "driver") {
        router.replace("/(driver)/" as any);
      } else if (role === "admin") {
        router.replace("/admin" as any);
      } else {
        router.replace("/(tabs)/" as any);
      }
      return;
    }

    // 4. Role-based protection
    if (role === "driver" && status === "pending" && !inPending) {
      router.replace("/auth/pending-approval" as any);
      return;
    }

    if (role === "admin" && !inAdmin && !inAuth) {
      router.replace("/admin" as any);
      return;
    }

    if (role === "driver" && status === "approved" && inTabs) {
      router.replace("/(driver)/" as any);
      return;
    }

    if (role !== "driver" && role !== "admin" && inDriver) {
      router.replace("/(tabs)/" as any);
      return;
    }
  }, [user, isLoading, segments]);

  return (
    <TowProvider userId={user?.role !== "driver" ? (user?.id ?? null) : null}>
      <DriverProvider driverId={user?.role === "driver" ? (user?.id ?? null) : null}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(driver)" />
          <Stack.Screen
            name="active-request"
            options={{ presentation: "fullScreenModal" }}
          />
          <Stack.Screen
            name="payment"
            options={{ presentation: "fullScreenModal", gestureEnabled: false }}
          />
          <Stack.Screen name="help" options={{ presentation: "modal" }} />
          <Stack.Screen name="edit-profile" options={{ presentation: "modal" }} />
        </Stack>
      </DriverProvider>
    </TowProvider>
  );
}
