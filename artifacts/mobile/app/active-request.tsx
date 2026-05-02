import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

const TOW_LABELS: Record<string, string> = {
  flatbed: "Flatbed Tow",
  hook_chain: "Hook & Chain Tow",
  repair: "Roadside Repair",
};

const STATUS_STEPS = ["searching", "accepted", "in_progress", "completed"];

export default function ActiveRequestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeRequest, towStatus, pendingPayment } = useTow();
  const [eta, setEta] = useState(activeRequest?.estimatedArrival ?? 8);
  const pulseAnim = new Animated.Value(1);

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
    if (eta <= 0) return;
    const timer = setInterval(() => setEta((v) => Math.max(0, v - 1)), 60000);
    return () => clearInterval(timer);
  }, [eta]);

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
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]}>
            <MaterialCommunityIcons name="truck-fast" size={40} color="#FFFFFF" />
          </Animated.View>
          <Text style={styles.statusTitle}>
            {towStatus === "accepted" ? "Driver Found!" : towStatus === "in_progress" ? "On the Way" : "Completing..."}
          </Text>
          <Text style={styles.etaText}>Estimated arrival: <Text style={styles.etaBold}>{eta} min</Text></Text>
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.cardTitle}>Request Status</Text>
          {["Driver Assigned", "En Route to You", "Arrived"].map((step, i) => {
            const done = towStatus === "accepted" ? i < 1 : towStatus === "in_progress" ? i < 2 : true;
            const active = towStatus === "accepted" ? i === 0 : towStatus === "in_progress" ? i === 1 : false;
            return (
              <View key={step} style={styles.stepRow}>
                <View style={[styles.stepCircle, done && styles.stepDone, active && styles.stepActive]}>
                  {done ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : <View style={[styles.stepInner, active && { backgroundColor: "#FFFFFF" }]} />}
                </View>
                {i < 2 && <View style={[styles.stepLine, done && styles.stepLineDone]} />}
                <Text style={[styles.stepLabel, (done || active) && styles.stepLabelActive]}>{step}</Text>
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
    header: { alignItems: "center", padding: 32, backgroundColor: colors.secondary },
    pulseCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    statusTitle: { fontSize: 24, fontWeight: "700" as const, color: "#FFFFFF", marginBottom: 8 },
    etaText: { fontSize: 15, color: "rgba(255,255,255,0.7)" },
    etaBold: { color: colors.primary, fontWeight: "700" as const },
    progressCard: { backgroundColor: colors.card, margin: 16, borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    cardTitle: { fontSize: 15, fontWeight: "700" as const, color: colors.text, marginBottom: 16 },
    stepRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
    stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" },
    stepDone: { backgroundColor: colors.success },
    stepActive: { backgroundColor: colors.primary },
    stepInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
    stepLine: { position: "absolute", left: 13, top: 28, width: 2, height: 24, backgroundColor: colors.border },
    stepLineDone: { backgroundColor: colors.success },
    stepLabel: { fontSize: 14, color: colors.mutedForeground, flex: 1 },
    stepLabelActive: { color: colors.text, fontWeight: "600" as const },
    detailCard: { backgroundColor: colors.card, marginHorizontal: 16, borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, gap: 14 },
    detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    detailIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
    detailLabel: { fontSize: 11, color: colors.mutedForeground, marginBottom: 2 },
    detailValue: { fontSize: 14, color: colors.text, fontWeight: "500" as const },
    actionsRow: { flexDirection: "row", gap: 12, marginHorizontal: 16, marginTop: 16 },
    actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14 },
    callBtn: { backgroundColor: colors.primary },
    helpActionBtn: { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border },
    actionText: { fontSize: 15, fontWeight: "700" as const, color: "#FFFFFF" },
  });
}
