import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTow } from "@/context/TowContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { getApiBase } from "@/utils/apiUrl";

type PaymentMethod = "mtn_momo" | "telecel_cash" | "at_money" | "cash" | "paystack";

const METHODS: { id: PaymentMethod; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; desc: string }[] = [
  { id: "paystack", label: "Paystack", icon: "card", color: "#00C3F7", desc: "Pay securely with Paystack" },
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
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("paystack");
  const [momoPhone, setMomoPhone] = useState(user?.phone ?? "+233");
  const [isLoading, setIsLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paystackUrl, setPaystackUrl] = useState<string | null>(null);
  const [paystackRef, setPaystackRef] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const amount = pendingPayment?.amount ?? 250;
  const towRequestId = pendingPayment?.requestId ?? "";

  const handlePaystack = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/payments/paystack/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          towRequestId,
          amount,
          email: user?.email ?? "customer@swifttow.com",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to initialize payment");
      setPaystackUrl(data.authorizationUrl);
      setPaystackRef(data.reference);
      setShowQR(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPaystack = async () => {
    if (!paystackUrl) return;
    if (Platform.OS !== "web") {
      await Linking.openURL(paystackUrl);
    } else {
      window.open(paystackUrl, "_blank");
    }
  };

  const handleVerifyPaystack = async () => {
    if (!paystackRef) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/payments/paystack/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: paystackRef, towRequestId, paymentMethod: "mtn_momo" }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message ?? "Payment not confirmed yet");
      }
      setPaid(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => { clearPendingPayment(); router.replace("/(tabs)"); }, 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePay = async () => {
    if (selectedMethod === "paystack") {
      await handlePaystack();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: towRequestId,
          amount,
          method: selectedMethod,
          phoneNumber: selectedMethod !== "cash" ? momoPhone : null,
        }),
      });
      if (!res.ok) throw new Error("Payment failed");
      setPaid(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => { clearPendingPayment(); router.replace("/(tabs)"); }, 2500);
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

  if (showQR && paystackUrl) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 24) }]}>
        <View style={styles.header}>
          <Pressable onPress={() => setShowQR(false)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Paystack QR Code</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.qrContainer}>
          <Text style={styles.qrLabel}>Scan to pay  GHS {amount.toFixed(2)}</Text>
          <View style={styles.qrBox}>
            <QRCode
              value={paystackUrl}
              size={220}
              color={colors.text}
              backgroundColor="transparent"
            />
          </View>
          <Text style={styles.qrHint}>or open the payment link on your phone</Text>

          <Pressable
            style={({ pressed }) => [styles.openLinkBtn, pressed && { opacity: 0.8 }]}
            onPress={handleOpenPaystack}
          >
            <Ionicons name="open-outline" size={16} color="#FFFFFF" />
            <Text style={styles.openLinkText}>Open Payment Link</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.verifyBtn, pressed && { opacity: 0.85 }]}
            onPress={handleVerifyPaystack}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.verifyBtnText}>I've Paid — Confirm Payment</Text>
              </>
            )}
          </Pressable>
        </View>
        <View style={{ height: insets.bottom + 16 }} />
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
              <Ionicons name={m.icon} size={22} color={m.color} />
            </View>
            <Text style={[styles.methodLabel, selectedMethod === m.id && styles.methodLabelActive]}>{m.label}</Text>
            {m.id === "paystack" && (
              <Text style={styles.methodBadge}>QR</Text>
            )}
          </Pressable>
        ))}
      </View>

      {selectedMethod !== "cash" && selectedMethod !== "paystack" && (
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

      {selectedMethod === "paystack" && (
        <View style={styles.paystackNote}>
          <Ionicons name="information-circle-outline" size={16} color="#00C3F7" />
          <Text style={styles.paystackNoteText}>A QR code will be generated for you to scan and pay securely via Paystack.</Text>
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
            {selectedMethod === "cash"
              ? "Confirm Cash Payment"
              : selectedMethod === "paystack"
              ? "Generate Payment QR"
              : `Pay GHS ${amount.toFixed(2)}`}
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
    header: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center" },
    backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 22, fontWeight: "700" as const, color: colors.text, flex: 1 },
    headerSub: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
    amountCard: { backgroundColor: colors.secondary, marginHorizontal: 16, borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 24 },
    amountLabel: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 6 },
    amountValue: { fontSize: 40, fontWeight: "700" as const, color: "#FFFFFF" },
    sectionTitle: { fontSize: 14, fontWeight: "600" as const, color: colors.mutedForeground, paddingHorizontal: 20, marginBottom: 12 },
    methodsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16, marginBottom: 20 },
    methodCard: { width: "47%", backgroundColor: colors.card, borderRadius: 14, padding: 16, alignItems: "center", gap: 6, borderWidth: 2, borderColor: "transparent", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    methodCardActive: { borderColor: colors.primary, backgroundColor: colors.accent },
    methodIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    methodLabel: { fontSize: 13, fontWeight: "600" as const, color: colors.mutedForeground, textAlign: "center" },
    methodLabelActive: { color: colors.primary },
    methodBadge: { fontSize: 10, fontWeight: "700" as const, color: "#00C3F7", backgroundColor: "#00C3F720", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    phoneInput: { paddingHorizontal: 16, marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: "600" as const, color: colors.text, marginBottom: 8 },
    inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
    input: { flex: 1, height: 46, fontSize: 15, color: colors.text },
    paystackNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginHorizontal: 16, marginBottom: 20, backgroundColor: "#00C3F710", borderRadius: 12, padding: 12 },
    paystackNoteText: { flex: 1, fontSize: 13, color: colors.mutedForeground, lineHeight: 18 },
    payBtn: { backgroundColor: colors.primary, marginHorizontal: 16, borderRadius: 14, height: 54, alignItems: "center", justifyContent: "center" },
    payBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const },
    qrContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20, paddingHorizontal: 24 },
    qrLabel: { fontSize: 18, fontWeight: "700" as const, color: colors.text },
    qrBox: { padding: 24, backgroundColor: colors.card, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8 },
    qrHint: { fontSize: 13, color: colors.mutedForeground },
    openLinkBtn: { backgroundColor: colors.secondary, borderRadius: 14, height: 48, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", gap: 8 },
    openLinkText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" as const },
    verifyBtn: { width: "100%", borderRadius: 14, height: 52, borderWidth: 2, borderColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.accent },
    verifyBtnText: { color: colors.primary, fontSize: 15, fontWeight: "700" as const },
  });
}
