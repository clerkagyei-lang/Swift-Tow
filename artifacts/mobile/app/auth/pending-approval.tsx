import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function PendingApprovalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();

  const styles = makeStyles(colors);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.secondary }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="time-outline" size={64} color={colors.primary} />
      </View>

      <Text style={styles.title}>Application Under Review</Text>
      <Text style={styles.subtitle}>
        Thank you for registering as a Swift Tow driver! Our team is currently reviewing your application.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What happens next?</Text>
        {[
          { icon: "checkmark-circle-outline" as const, text: "We verify your license and vehicle details" },
          { icon: "shield-checkmark-outline" as const, text: "Background check is completed (1–2 business days)" },
          { icon: "notifications-outline" as const, text: "You'll be notified by email once approved" },
          { icon: "car-sport-outline" as const, text: "Start earning on the Swift Tow platform!" },
        ].map((step, i) => (
          <View key={i} style={styles.step}>
            <View style={[styles.stepIcon, { backgroundColor: colors.primary + "18" }]}>
              <Ionicons name={step.icon} size={20} color={colors.primary} />
            </View>
            <Text style={styles.stepText}>{step.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.contactCard}>
        <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />
        <Text style={styles.contactText}>Questions? Contact{" "}
          <Text style={{ color: colors.primary, fontWeight: "600" as const }}>support@swifttow.com</Text>
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.75 }]}
        onPress={async () => { await logout(); router.replace("/auth/login" as any); }}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.mutedForeground} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { alignItems: "center", paddingHorizontal: 24 },
    iconWrap: { width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,107,0,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 24 },
    title: { fontSize: 24, fontWeight: "700" as const, color: "#FFFFFF", textAlign: "center", marginBottom: 12 },
    subtitle: { fontSize: 15, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 22, marginBottom: 28 },
    card: { backgroundColor: colors.card, borderRadius: 20, padding: 20, width: "100%", marginBottom: 16 },
    cardTitle: { fontSize: 15, fontWeight: "700" as const, color: colors.text, marginBottom: 16 },
    step: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 12 },
    stepIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    stepText: { fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 },
    contactCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.card, borderRadius: 12, padding: 14, width: "100%", marginBottom: 24 },
    contactText: { fontSize: 13, color: colors.mutedForeground, flex: 1 },
    logoutBtn: { flexDirection: "row", alignItems: "center", gap: 8, opacity: 0.8 },
    logoutText: { fontSize: 14, color: colors.mutedForeground },
  });
}
