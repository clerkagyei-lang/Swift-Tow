import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showQR, setShowQR] = useState(false);

  const styles = makeStyles(colors);

  const handleLogout = () => {
    if (Platform.OS === "web") {
      logout();
      router.replace("/auth/login");
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  if (!user) return null;

  const menuItems = [
    { icon: "person-outline", label: "Edit Profile", action: () => router.push("/edit-profile") },
    { icon: "qr-code-outline", label: "My QR Code", action: () => { setShowQR(true); Haptics.selectionAsync(); } },
    { icon: "headset-outline", label: "Help & Support", action: () => router.push("/help") },
  ];

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? insets.top + 67 : 0 }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.phoneRow}>
            <Ionicons name="call" size={14} color={colors.primary} />
            <Text style={styles.phone}>{user.phone}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            <Text style={styles.statValue}>Verified</Text>
            <Text style={styles.statLabel}>Account</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="star" size={20} color={colors.warning} />
            <Text style={styles.statValue}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="car" size={20} color={colors.secondary} />
            <Text style={styles.statValue}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Text>
            <Text style={styles.statLabel}>Role</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { backgroundColor: colors.muted },
                index < menuItems.length - 1 && styles.menuItemBorder,
              ]}
              onPress={item.action}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon as "person-outline"} size={18} color={colors.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        {/* Sign out */}
        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.8 }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <View style={{ height: insets.bottom + (Platform.OS === "web" ? 34 : 100) }} />
      </ScrollView>

      {/* QR Code Modal */}
      <Modal visible={showQR} animationType="slide" transparent presentationStyle="overFullScreen">
        <Pressable style={styles.modalOverlay} onPress={() => setShowQR(false)}>
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>My QR Code</Text>
            <Text style={styles.qrSubtitle}>Show this to your driver for verification</Text>
            <View style={styles.qrBox}>
              <QRCode value={user.id} size={180} color={colors.secondary} />
            </View>
            <Text style={styles.qrId}>{user.id.slice(0, 8).toUpperCase()}</Text>
            <Pressable style={styles.closeBtn} onPress={() => setShowQR(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    hero: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 20 },
    avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    avatarLetter: { fontSize: 32, fontWeight: "700" as const, color: "#FFFFFF" },
    name: { fontSize: 22, fontWeight: "700" as const, color: colors.text, marginBottom: 4 },
    email: { fontSize: 14, color: colors.mutedForeground, marginBottom: 6 },
    phoneRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    phone: { fontSize: 14, color: colors.text, fontWeight: "500" as const },
    statsRow: { flexDirection: "row", backgroundColor: colors.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    statItem: { flex: 1, alignItems: "center", gap: 4 },
    statDivider: { width: 1, backgroundColor: colors.border },
    statValue: { fontSize: 15, fontWeight: "700" as const, color: colors.text },
    statLabel: { fontSize: 11, color: colors.mutedForeground },
    menuCard: { backgroundColor: colors.card, marginHorizontal: 16, borderRadius: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, overflow: "hidden" },
    menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16 },
    menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    menuLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
    menuLabel: { fontSize: 15, fontWeight: "500" as const, color: colors.text },
    signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, padding: 16, backgroundColor: "#FEF2F2", borderRadius: 14 },
    signOutText: { fontSize: 15, fontWeight: "600" as const, color: colors.destructive },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "flex-end" },
    qrCard: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 32, alignItems: "center", width: "100%" },
    qrTitle: { fontSize: 22, fontWeight: "700" as const, color: colors.text, marginBottom: 6 },
    qrSubtitle: { fontSize: 14, color: colors.mutedForeground, marginBottom: 24, textAlign: "center" },
    qrBox: { padding: 20, backgroundColor: "#FFFFFF", borderRadius: 16, marginBottom: 16 },
    qrId: { fontSize: 13, color: colors.mutedForeground, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", marginBottom: 24 },
    closeBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, width: "100%" },
    closeBtnText: { color: "#FFFFFF", fontWeight: "700" as const, fontSize: 15, textAlign: "center" },
  });
}
