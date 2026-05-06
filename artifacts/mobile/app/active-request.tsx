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
import MapComponent from "@/components/MapComponent";

const TOW_LABELS: Record<string, string> = {
  flatbed: "Flatbed Tow",
  hook_chain: "Hook & Chain Tow",
  repair: "Roadside Repair",
};

export default function ActiveRequestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeRequest, towStatus, pendingPayment, driverLocation } = useTow();
  const mapRef = useRef<any>(null);
  const [eta, setEta] = useState(activeRequest?.estimatedArrival ?? 8);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (pendingPayment) {
      router.replace("/payment");
    }
  }, [pendingPayment]);

  useEffect(() => {
    if (eta <= 0) return;
    const timer = setInterval(() => setEta((v) => Math.max(0, v - 1)), 60000);
    return () => clearInterval(timer);
  }, [eta]);

  const handleCall = () => {
    const phone = activeRequest?.userPhone ?? "+233200000000";
    if (Platform.OS !== "web") Linking.openURL(`tel:${phone}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const statusLabel =
    towStatus === "accepted" ? "Driver Found!" :
    towStatus === "in_progress" ? "Driver En Route" :
    "Completing...";

  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      {/* Full-screen map showing user pin + approaching driver truck */}
      <MapComponent
        mapRef={mapRef}
        location={activeRequest?.pickupLocation ?? null}
        driverLocation={driverLocation}
        colors={colors}
        followUser={!driverLocation}
      />

      {/* Back button — floating top-left */}
      <Pressable
        style={[styles.backBtn, { top: insets.top + (Platform.OS === "web" ? 72 : 16) }]}
        onPress={() => router.back()}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={20} color={colors.text} />
      </Pressable>

      {/* Status pill — floating top-center */}
      <View style={[styles.statusPill, { top: insets.top + (Platform.OS === "web" ? 72 : 16) }]}>
        <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]} />
        <MaterialCommunityIcons name="truck-fast" size={16} color={colors.primary} />
        <Text style={styles.statusPillText}>{statusLabel}</Text>
        <View style={styles.etaPill}>
          <Text style={styles.etaText}>{eta} min</Text>
        </View>
      </View>

      {/* Live tracking label — only when driver location is active */}
      {driverLocation && (
        <View style={[styles.trackingBadge, { top: insets.top + (Platform.OS === "web" ? 120 : 64) }]}>
          <View style={styles.trackingDot} />
          <Text style={styles.trackingText}>Live tracking active</Text>
        </View>
      )}

      {/* Bottom panel — overlaid on map */}
      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20) }]}>
        <View style={styles.handleBar} />

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Progress steps */}
          <Text style={styles.sectionTitle}>Request Status</Text>
          {["Driver Assigned", "En Route to You", "Arrived"].map((step, i) => {
            const done = towStatus === "accepted" ? i < 1 : towStatus === "in_progress" ? i < 2 : true;
            const active = towStatus === "accepted" ? i === 0 : towStatus === "in_progress" ? i === 1 : false;
            return (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepCircle, done && styles.stepDone, active && styles.stepActive]}>
                    {done
                      ? <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                      : <View style={[styles.stepInner, active && { backgroundColor: "#FFFFFF" }]} />}
                  </View>
                  {i < 2 && <View style={[styles.stepConnector, done && styles.stepConnectorDone]} />}
                </View>
                <Text style={[styles.stepLabel, (done || active) && styles.stepLabelActive]}>{step}</Text>
              </View>
            );
          })}

          {/* Request details */}
          {activeRequest && (
            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MaterialCommunityIcons name="truck-flatbed" size={15} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Tow Type</Text>
                  <Text style={styles.detailValue}>{TOW_LABELS[activeRequest.towType]}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="location" size={15} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Your Location</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>{activeRequest.pickupAddress}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="car" size={15} color={colors.primary} />
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
              <Ionicons name="call" size={18} color="#FFFFFF" />
              <Text style={styles.actionText}>Call Driver</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.supportBtn, pressed && { opacity: 0.8 }]}
              onPress={() => router.push("/help")}
            >
              <Ionicons name="headset" size={18} color={colors.secondary} />
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

    backBtn: {
      position: "absolute",
      left: 16,
      zIndex: 20,
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "rgba(255,255,255,0.95)",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },

    statusPill: {
      position: "absolute",
      alignSelf: "center",
      left: 66,
      right: 16,
      zIndex: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255,255,255,0.97)",
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    pulseDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    statusPillText: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700" as const,
      color: colors.text,
    },
    etaPill: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    etaText: {
      fontSize: 12,
      fontWeight: "700" as const,
      color: colors.primary,
    },

    trackingBadge: {
      position: "absolute",
      alignSelf: "center",
      zIndex: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "rgba(255,255,255,0.92)",
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    trackingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.success,
    },
    trackingText: {
      fontSize: 11,
      fontWeight: "600" as const,
      color: colors.success,
    },

    bottomPanel: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: "52%",
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 16,
      paddingTop: 12,
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

    sectionTitle: {
      fontSize: 14,
      fontWeight: "700" as const,
      color: colors.text,
      marginBottom: 12,
    },
    stepRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 2,
    },
    stepLeft: {
      alignItems: "center",
      width: 28,
    },
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
    stepInner: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.border,
    },
    stepConnector: {
      width: 2,
      height: 20,
      backgroundColor: colors.border,
      marginTop: 2,
    },
    stepConnectorDone: { backgroundColor: colors.success },
    stepLabel: {
      fontSize: 13,
      color: colors.mutedForeground,
      paddingTop: 5,
      flex: 1,
    },
    stepLabelActive: {
      color: colors.text,
      fontWeight: "600" as const,
    },

    detailCard: {
      backgroundColor: colors.muted,
      borderRadius: 14,
      padding: 14,
      gap: 10,
      marginTop: 14,
      marginBottom: 12,
    },
    detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    detailIcon: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    detailLabel: { fontSize: 10, color: colors.mutedForeground, marginBottom: 2 },
    detailValue: { fontSize: 13, color: colors.text, fontWeight: "500" as const },

    actionsRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 14,
      borderRadius: 13,
    },
    callBtn: { backgroundColor: colors.primary },
    supportBtn: {
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionText: { fontSize: 14, fontWeight: "700" as const, color: "#FFFFFF" },
  });
}
