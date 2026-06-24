import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTow } from "@/context/TowContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { getApiBase } from "@/utils/apiUrl";

type PaymentMethod = "mtn_momo" | "telecel_cash" | "at_money" | "cash";

const METHODS: { id: PaymentMethod; label: string; icon: string; color: string; desc: string }[] = [
  { id: "mtn_momo", label: "MTN MoMo", icon: "phone-portrait", color: "#FFCC00", desc: "Pay with MTN Mobile Money" },
  { id: "telecel_cash", label: "Telecel Cash", icon: "phone-portrait", color: "#E31837", desc: "Pay with Telecel Cash" },
  { id: "at_money", label: "AT Money", icon: "phone-portrait", color: "#00A651", desc: "Pay with AT Money" },
  { id: "cash", label: "Cash", icon: "cash", color: "#27AE60", desc: "Pay driver in cash" },
];

export default function PaymentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { pendingPayment, clearPendingPayment } = useTow();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("mtn_momo");
  const [momoPhone, setMomoPhone] = useState(user?.phone ?? "+233");
  const [isLoading, setIsLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  const amount = pendingPayment?.amount ?? 250;
  const tripId = pendingPayment?.requestId ?? "";

  const handlePay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          amount,
          method: selectedMethod,
          phoneNumber: selectedMethod !== "cash" ? momoPhone : null,
        }),
      });
      if (!res.ok) throw new Error("Payment failed");
      setPaid(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        clearPendingPayment();
        router.replace("/(tabs)");
      }, 2500);
    } catch {
      setIsLoading(false);
    }
  };

  const styles = makeStyles(colors);

  if (paid) {
    return (
      <View style={[styles.container, styles.successContainer]}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successText}>Thank you for using Swift Tow. Your trip has been completed.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <Text style={styles.headerSub}>Trip has been completed</Text>
      </View>

      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Amount Due</Text>
        <Text style={styles.amountValue}>GHS {amount.toFixed(2)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Select Payment Method</Text>
      <View style={styles.methodsGrid}>
        {METHODS.map((m) => (
          <Pressable
            key={m.id}
            style={[styles.methodCard, selectedMethod === m.id && styles.methodCardActive]}
            onPress={() => { setSelectedMethod(m.id); Haptics.selectionAsync(); }}
          >
            <View style={[styles.methodIconCircle, { backgroundColor: m.color + "20" }]}>
              <Ionicons name={m.icon as "cash"} size={22} color={m.color} />
            </View>
            <Text style={[styles.methodLabel, selectedMethod === m.id && styles.methodLabelActive]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      {selectedMethod !== "cash" && (
        <View style={styles.phoneInput}>
          <Text style={styles.inputLabel}>Mobile Money Number</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              value={momoPhone}
              onChangeText={setMomoPhone}
              keyboardType="phone-pad"
              placeholder="+233 XX XXX XXXX"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [styles.payBtn, pressed && { opacity: 0.85 }]}
        onPress={handlePay}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payBtnText}>
            {selectedMethod === "cash" ? "Confirm Cash Payment" : `Pay GHS ${amount.toFixed(2)}`}
          </Text>
        )}
      </Pressable>

      <View style={{ height: insets.bottom + (Platform.OS === "web" ? 34 : 16) }} />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    successContainer: { alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
    successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
    successTitle: { fontSize: 26, fontWeight: "700" as const, color: colors.text },
    successText: { fontSize: 15, color: colors.mutedForeground, textAlign: "center" },
    header: { paddingHorizontal: 20, paddingBottom: 16 },
    headerTitle: { fontSize: 24, fontWeight: "700" as const, color: colors.text },
    headerSub: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
    amountCard: { backgroundColor: colors.secondary, marginHorizontal: 16, borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 24 },
    amountLabel: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 6 },
    amountValue: { fontSize: 40, fontWeight: "700" as const, color: "#FFFFFF" },
    sectionTitle: { fontSize: 14, fontWeight: "600" as const, color: colors.mutedForeground, paddingHorizontal: 20, marginBottom: 12 },
    methodsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16, marginBottom: 20 },
    methodCard: { width: "47%", backgroundColor: colors.card, borderRadius: 14, padding: 16, alignItems: "center", gap: 8, borderWidth: 2, borderColor: "transparent", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    methodCardActive: { borderColor: colors.primary, backgroundColor: colors.accent },
    methodIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    methodLabel: { fontSize: 13, fontWeight: "600" as const, color: colors.mutedForeground, textAlign: "center" },
    methodLabelActive: { color: colors.primary },
    phoneInput: { paddingHorizontal: 16, marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: "600" as const, color: colors.text, marginBottom: 8 },
    inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
    input: { flex: 1, height: 46, fontSize: 15, color: colors.text },
    payBtn: { backgroundColor: colors.primary, marginHorizontal: 16, borderRadius: 14, height: 54, alignItems: "center", justifyContent: "center" },
    payBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const },
  });
}
