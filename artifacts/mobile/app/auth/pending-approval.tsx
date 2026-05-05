import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const STEPS = [
  { icon: "document-text-outline" as const, label: "Application submitted", done: true },
  { icon: "shield-checkmark-outline" as const, label: "License verification", done: false },
  { icon: "car-outline" as const, label: "Vehicle inspection", done: false },
  { icon: "checkmark-circle-outline" as const, label: "Account activated", done: false },
];

export default function PendingApprovalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const styles = makeStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="clock-check-outline" size={72} color={colors.primary} />
        </View>

        <Text style={styles.heading}>Application Under Review</Text>
        <Text style={styles.sub}>
          Hi {user?.name?.split(" ")[0]}, your driver application has been received.
          Our team is reviewing your details and will notify you once approved.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Verification Steps</Text>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={[styles.stepDot, step.done && styles.stepDotDone]}>
                {step.done
                  ? <Ionicons name="checkmark" size={14} color="#fff" />
                  : <Text style={styles.stepNum}>{i + 1}</Text>
                }
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, step.done && styles.stepLineDone]} />
              )}
              <View style={styles.stepContent}>
                <Ionicons name={step.icon} size={18} color={step.done ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.stepLabel, step.done && { color: colors.primary, fontWeight: "600" as const }]}>
                  {step.label}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="time-outline" size={18} color="#92400E" />
          <Text style={styles.infoText}>
            Approval typically takes <Text style={{ fontWeight: "700" as const }}>1–2 business days</Text>. You will receive a notification once your account is activated.
          </Text>
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Need help?</Text>
          <Text style={styles.contactText}>Contact our driver support team</Text>
          <Pressable style={styles.contactBtn}>
            <Ionicons name="mail-outline" size={16} color={colors.primary} />
            <Text style={styles.contactBtnText}>drivers@swifttow.com</Text>
          </Pressable>
        </View>

        <Pressable style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={colors.mutedForeground} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 24, alignItems: "center" },
    iconWrap: {
      width: 120, height: 120, borderRadius: 60,
      backgroundColor: `${colors.primary}15`,
      alignItems: "center", justifyContent: "center", marginBottom: 24,
    },
    heading: { fontSize: 24, fontWeight: "800" as const, color: colors.text, textAlign: "center", marginBottom: 12 },
    sub: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", lineHeight: 22, marginBottom: 28, maxWidth: 320 },
    card: { width: "100%", backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    cardTitle: { fontSize: 14, fontWeight: "700" as const, color: colors.text, marginBottom: 20 },
    step: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16, position: "relative" },
    stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.muted, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginRight: 12, zIndex: 1 },
    stepDotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
    stepNum: { fontSize: 11, fontWeight: "700" as const, color: colors.mutedForeground },
    stepLine: { position: "absolute", left: 13, top: 28, width: 2, height: 20, backgroundColor: colors.border },
    stepLineDone: { backgroundColor: colors.primary },
    stepContent: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 4 },
    stepLabel: { fontSize: 14, color: colors.mutedForeground },
    infoCard: { width: "100%", flexDirection: "row", gap: 10, backgroundColor: "#FEF3C7", borderRadius: 12, padding: 14, marginBottom: 16 },
    infoText: { fontSize: 13, color: "#92400E", flex: 1, lineHeight: 20 },
    contactCard: { width: "100%", backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 24, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    contactTitle: { fontSize: 15, fontWeight: "700" as const, color: colors.text, marginBottom: 4 },
    contactText: { fontSize: 13, color: colors.mutedForeground, marginBottom: 12 },
    contactBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: `${colors.primary}15`, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
    contactBtnText: { fontSize: 14, color: colors.primary, fontWeight: "600" as const },
    logoutBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
    logoutText: { fontSize: 14, color: colors.mutedForeground },
  });
}
