import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTow } from "@/context/TowContext";
import { useColors } from "@/hooks/useColors";
import { haversineKm } from "@/context/DriverContext";

const TOW_LABELS: Record<string, string> = {
  flatbed: "Flatbed Tow",
  hook_chain: "Hook & Chain Tow",
  repair: "Roadside Repair",
};

const AVG_SPEED_KMH = 25;

function formatEta(minutes: number): string {
  if (minutes <= 0) return "Arriving now";
  if (minutes < 1) {
    const secs = Math.round(minutes * 60);
    return `${secs}s`;
  }
  if (minutes < 60) {
    const m = Math.floor(minutes);
    const s = Math.round((minutes - m) * 60);
    return s > 0 ? `${m}m ${s}s` : `${m} min`;
  }
  return `${Math.ceil(minutes)} min`;
}

export default function ActiveRequestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeRequest, towStatus, pendingPayment, driverLocation } = useTow();

  const [etaMinutes, setEtaMinutes] = useState<number>(
    activeRequest?.estimatedArrival ?? 8
  );
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [initialDistanceKm, setInitialDistanceKm] = useState<number | null>(null);
  const [etaDisplay, setEtaDisplay] = useState("");

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const etaFlash = useRef(new Animated.Value(1)).current;
  const prevEta = useRef(etaMinutes);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (pendingPayment) {
      router.replace("/payment");
    }
  }, [pendingPayment]);

  useEffect(() => {
    if (!driverLocation || !activeRequest?.pickupLocation) return;

    const dist = haversineKm(
      driverLocation.latitude,
      driverLocation.longitude,
      activeRequest.pickupLocation.latitude,
      activeRequest.pickupLocation.longitude
    );

    setDistanceKm(dist);

    if (initialDistanceKm === null) {
      setInitialDistanceKm(dist);
    }

    const eta = (dist / AVG_SPEED_KMH) * 60;
    setEtaMinutes(eta);
  }, [driverLocation, activeRequest?.pickupLocation]);

  useEffect(() => {
    setEtaDisplay(formatEta(etaMinutes));

    if (prevEta.current !== etaMinutes && prevEta.current > etaMinutes) {
      Animated.sequence([
        Animated.timing(etaFlash, { toValue: 0.4, duration: 180, useNativeDriver: true }),
        Animated.timing(etaFlash, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
    prevEta.current = etaMinutes;
  }, [etaMinutes]);

  useEffect(() => {
    if (etaMinutes <= 0 || driverLocation) return;
    const timer = setInterval(() => {
      setEtaMinutes((v) => Math.max(0, v - 1));
    }, 60000);
    return () => clearInterval(timer);
  }, [etaMinutes, driverLocation]);

  const progressPct =
    distanceKm !== null && initialDistanceKm !== null && initialDistanceKm > 0
      ? Math.max(0, Math.min(1, 1 - distanceKm / initialDistanceKm))
      : null;

  const handleCall = () => {
    const phone = activeRequest?.userPhone ?? "+233200000000";
    if (Platform.OS !== "web") {
      Linking.openURL(`tel:${phone}`);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const styles = makeStyles(colors);

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>

          <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]}>
            <MaterialCommunityIcons name="truck-fast" size={40} color="#FFFFFF" />
          </Animated.View>

          <Text style={styles.statusTitle}>
            {towStatus === "accepted"
              ? "Driver Found!"
              : towStatus === "in_progress"
              ? "On the Way"
              : "Completing..."}
          </Text>

          {/* Live ETA */}
          <Animated.View style={[styles.etaChip, { opacity: etaFlash }]}>
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text style={styles.etaChipText}>
              {etaDisplay || formatEta(etaMinutes)}
            </Text>
          </Animated.View>

          {distanceKm !== null && (
            <Text style={styles.distText}>
              Driver is{" "}
              <Text style={styles.distBold}>
                {distanceKm < 1
                  ? `${Math.round(distanceKm * 1000)} m`
                  : `${distanceKm.toFixed(1)} km`}
              </Text>{" "}
              away
            </Text>
          )}
        </View>

        {/* Live progress bar */}
        {progressPct !== null && (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarTrack}>
              <Animated.View
                style={[styles.progressBarFill, { width: `${Math.round(progressPct * 100)}%` as any }]}
              />
            </View>
            <View style={styles.progressBarLabels}>
              <Text style={styles.progressBarLabel}>Driver start</Text>
              <Text style={[styles.progressBarLabel, { color: colors.primary }]}>
                {Math.round(progressPct * 100)}% there
              </Text>
              <Text style={styles.progressBarLabel}>Your location</Text>
            </View>
          </View>
        )}

        {/* Status steps */}
        <View style={styles.progressCard}>
          <Text style={styles.cardTitle}>Request Status</Text>
          {["Driver Assigned", "En Route to You", "Arrived"].map((step, i) => {
            const done =
              towStatus === "accepted" ? i < 1 : towStatus === "in_progress" ? i < 2 : true;
            const active =
              towStatus === "accepted" ? i === 0 : towStatus === "in_progress" ? i === 1 : false;
            return (
              <View key={step} style={styles.stepRow}>
                <View style={[styles.stepCircle, done && styles.stepDone, active && styles.stepActive]}>
                  {done ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <View style={[styles.stepInner, active && { backgroundColor: "#FFFFFF" }]} />
                  )}
                </View>
                {i < 2 && <View style={[styles.stepLine, done && styles.stepLineDone]} />}
                <Text style={[styles.stepLabel, (done || active) && styles.stepLabelActive]}>
                  {step}
                </Text>
                {active && driverLocation && distanceKm !== null && i === 0 && (
                  <Text style={styles.stepLive}>● LIVE</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Request details */}
        {activeRequest && (
          <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Request Details</Text>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <MaterialCommunityIcons name="truck-flatbed" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Tow Type</Text>
                <Text style={styles.detailValue}>{TOW_LABELS[activeRequest.towType]}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="location" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Pickup Location</Text>
                <Text style={styles.detailValue} numberOfLines={2}>{activeRequest.pickupAddress}</Text>
              </View>
            </View>
            {activeRequest.dropoffAddress && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="flag" size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Drop-off Location</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>{activeRequest.dropoffAddress}</Text>
                </View>
              </View>
            )}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="car" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Vehicle</Text>
                <Text style={styles.detailValue}>{activeRequest.vehicleDetails}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.callBtn, pressed && { opacity: 0.8 }]}
            onPress={handleCall}
          >
            <Ionicons name="call" size={20} color="#FFFFFF" />
            <Text style={styles.actionText}>Call Driver</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.helpActionBtn, pressed && { opacity: 0.8 }]}
            onPress={() => router.push("/help")}
          >
            <Ionicons name="headset" size={20} color={colors.secondary} />
            <Text style={[styles.actionText, { color: colors.secondary }]}>Support</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { alignItems: "center", padding: 32, paddingTop: 20, backgroundColor: colors.secondary },
    backBtn: {
      position: "absolute",
      top: 16,
      left: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.15)",
    },
    backBtnText: { fontSize: 14, fontWeight: "600" as const, color: "#FFFFFF" },
    pulseCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    statusTitle: { fontSize: 24, fontWeight: "700" as const, color: "#FFFFFF", marginBottom: 12 },
    etaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255,255,255,0.95)",
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginBottom: 8,
    },
    etaChipText: { fontSize: 18, fontWeight: "800" as const, color: colors.primary },
    distText: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 2 },
    distBold: { color: "#FFFFFF", fontWeight: "700" as const },
    progressBarContainer: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 4,
      backgroundColor: colors.card,
    },
    progressBarTrack: {
      height: 8,
      backgroundColor: colors.muted,
      borderRadius: 4,
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    progressBarLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 6,
      marginBottom: 2,
    },
    progressBarLabel: { fontSize: 10, color: colors.mutedForeground },
    progressCard: {
      backgroundColor: colors.card,
      margin: 16,
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    cardTitle: { fontSize: 15, fontWeight: "700" as const, color: colors.text, marginBottom: 16 },
    stepRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
    stepCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    stepDone: { backgroundColor: colors.success },
    stepActive: { backgroundColor: colors.primary },
    stepInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
    stepLine: {
      position: "absolute",
      left: 13,
      top: 28,
      width: 2,
      height: 24,
      backgroundColor: colors.border,
    },
    stepLineDone: { backgroundColor: colors.success },
    stepLabel: { fontSize: 14, color: colors.mutedForeground, flex: 1 },
    stepLabelActive: { color: colors.text, fontWeight: "600" as const },
    stepLive: { fontSize: 10, fontWeight: "700" as const, color: colors.primary },
    detailCard: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
      gap: 14,
    },
    detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    detailIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    detailLabel: { fontSize: 11, color: colors.mutedForeground, marginBottom: 2 },
    detailValue: { fontSize: 14, color: colors.text, fontWeight: "500" as const },
    actionsRow: { flexDirection: "row", gap: 12, marginHorizontal: 16, marginTop: 16 },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 16,
      borderRadius: 14,
    },
    callBtn: { backgroundColor: colors.primary },
    helpActionBtn: { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border },
    actionText: { fontSize: 15, fontWeight: "700" as const, color: "#FFFFFF" },
  });
}
