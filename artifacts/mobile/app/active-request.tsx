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
import MapComponent from "@/components/MapComponent";

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
  const mapRef = useRef<any>(null);

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
    if (initialDistanceKm === null) setInitialDistanceKm(dist);
    setEtaMinutes((dist / AVG_SPEED_KMH) * 60);
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
    if (Platform.OS !== "web") Linking.openURL(`tel:${phone}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <MapComponent
        mapRef={mapRef}
        location={activeRequest?.pickupLocation ?? null}
        driverLocation={driverLocation}
        dropoffLocation={null}
        colors={{ primary: colors.primary, secondary: colors.secondary }}
      />

      <View style={[styles.topBar, { top: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>

        <View style={styles.statusBadge}>
          <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.statusText}>
            {towStatus === "accepted" ? "Driver Found!" : towStatus === "in_progress" ? "On the Way" : "Completing…"}
          </Text>
        </View>
      </View>

      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 20 : 16) }]}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.handleBar} />

          <View style={styles.etaRow}>
            <View style={styles.etaChip}>
              <Ionicons name="time-outline" size={14} color={colors.primary} />
              <Animated.Text style={[styles.etaChipText, { opacity: etaFlash }]}>
                {etaDisplay || formatEta(etaMinutes)}
              </Animated.Text>
              <Text style={styles.etaLabel}>ETA</Text>
            </View>
            {distanceKm !== null && (
              <View style={styles.distChip}>
                <MaterialCommunityIcons name="truck-fast" size={16} color={colors.secondary} />
                <Text style={styles.distText}>
                  {distanceKm < 1
                    ? `${Math.round(distanceKm * 1000)} m`
                    : `${distanceKm.toFixed(1)} km`}
                  {" "}away
                </Text>
              </View>
            )}
          </View>

          {progressPct !== null && (
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${Math.round(progressPct * 100)}%` as any }]} />
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

          <View style={styles.stepsCard}>
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
                  <Text style={[styles.stepLabel, (done || active) && styles.stepLabelActive]}>{step}</Text>
                  {active && driverLocation && distanceKm !== null && i === 0 && (
                    <Text style={styles.stepLive}>● LIVE</Text>
                  )}
                </View>
              );
            })}
          </View>

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
                    <Text style={styles.detailLabel}>Drop-off</Text>
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
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    topBar: {
      position: "absolute",
      left: 16,
      right: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      zIndex: 10,
    },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    backBtnText: { fontSize: 14, fontWeight: "600" as const, color: "#FFFFFF" },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.secondary,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 6,
    },
    pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
    statusText: { color: "#FFFFFF", fontWeight: "700" as const, fontSize: 14 },
    bottomPanel: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 16,
      paddingTop: 12,
      maxHeight: "62%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 12,
    },
    handleBar: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 14,
    },
    etaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    etaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    etaChipText: { fontSize: 22, fontWeight: "800" as const, color: colors.primary },
    etaLabel: { fontSize: 11, color: colors.mutedForeground, fontWeight: "600" as const },
    distChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.muted,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    distText: { fontSize: 13, fontWeight: "600" as const, color: colors.text },
    progressBarContainer: { marginBottom: 14 },
    progressBarTrack: {
      height: 6,
      backgroundColor: colors.muted,
      borderRadius: 3,
      overflow: "hidden",
    },
    progressBarFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 3 },
    progressBarLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 4,
    },
    progressBarLabel: { fontSize: 10, color: colors.mutedForeground },
    stepsCard: {
      backgroundColor: colors.muted,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    cardTitle: { fontSize: 14, fontWeight: "700" as const, color: colors.text, marginBottom: 14 },
    stepRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
    stepCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    stepDone: { backgroundColor: colors.success },
    stepActive: { backgroundColor: colors.primary },
    stepInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.border },
    stepLine: {
      position: "absolute",
      left: 12,
      top: 26,
      width: 2,
      height: 22,
      backgroundColor: colors.border,
    },
    stepLineDone: { backgroundColor: colors.success },
    stepLabel: { fontSize: 13, color: colors.mutedForeground, flex: 1 },
    stepLabelActive: { color: colors.text, fontWeight: "600" as const },
    stepLive: { fontSize: 10, fontWeight: "700" as const, color: colors.primary },
    detailCard: {
      backgroundColor: colors.muted,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      gap: 12,
    },
    detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    detailIcon: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    detailLabel: { fontSize: 11, color: colors.mutedForeground, marginBottom: 2 },
    detailValue: { fontSize: 13, color: colors.text, fontWeight: "500" as const },
    actionsRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
    },
    callBtn: { backgroundColor: colors.primary },
    helpActionBtn: { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border },
    actionText: { fontSize: 14, fontWeight: "700" as const, color: "#FFFFFF" },
  });
}
