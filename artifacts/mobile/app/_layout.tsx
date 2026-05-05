import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { TowProvider } from "@/context/TowContext";
import { DriverProvider } from "@/context/DriverContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === "auth";
    const inDriver = segments[0] === "(driver)";
    const inTabs = segments[0] === "(tabs)";

    const inPending = segments[0] === "auth" && segments[1] === "pending-approval";
    const inAdmin = segments[0] === "admin";

    if (!user && !inAuth) {
      router.replace("/auth/login" as any);
      return;
    }

    if (user && inAuth && !inPending) {
      if (user.role === "driver" && user.approvalStatus === "pending") {
        router.replace("/auth/pending-approval" as any);
      } else if (user.role === "driver") {
        router.replace("/(driver)/" as any);
      } else if (user.role === "admin") {
        router.replace("/admin" as any);
      } else {
        router.replace("/(tabs)/" as any);
      }
      return;
    }

    // Pending driver trying to access driver app — keep on pending screen
    if (user?.role === "driver" && user.approvalStatus === "pending" && !inPending) {
      router.replace("/auth/pending-approval" as any);
      return;
    }

    // Admin routing
    if (user?.role === "admin" && !inAdmin && !inAuth) {
      router.replace("/admin" as any);
      return;
    }

    // Prevent drivers from accessing user tabs and vice versa
    if (user && user.role === "driver" && user.approvalStatus === "approved" && inTabs) {
      router.replace("/(driver)/" as any);
      return;
    }
    if (user && user.role !== "driver" && user.role !== "admin" && inDriver) {
      router.replace("/(tabs)/" as any);
    }
  }, [user, isLoading, segments]);

  if (isLoading) return null;

  return (
    <TowProvider userId={user?.role !== "driver" ? (user?.id ?? null) : null}>
      <DriverProvider driverId={user?.role === "driver" ? (user?.id ?? null) : null}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(driver)" />
          <Stack.Screen name="admin" />
          <Stack.Screen name="active-request" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="payment" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
          <Stack.Screen name="help" options={{ presentation: "modal" }} />
          <Stack.Screen name="edit-profile" options={{ presentation: "modal" }} />
        </Stack>
      </DriverProvider>
    </TowProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <RootLayoutNav />
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
