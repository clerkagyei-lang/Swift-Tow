import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "+233");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      setError("Name and phone are required");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "localhost";
      const res = await fetch(`https://${domain}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, name: name.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Update failed"); return; }
      updateUser(data);
      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => router.back(), 1500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const styles = makeStyles(colors);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{(user?.name ?? "?").charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.avatarName}>{user?.name}</Text>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.destructive} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {success && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.successText}>Profile updated successfully!</Text>
          </View>
        )}

        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={[styles.inputWrap, styles.disabledInput]}>
              <Ionicons name="mail-outline" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.mutedForeground }]}
                value={user?.email}
                editable={false}
                placeholder="Email"
                placeholderTextColor={colors.mutedForeground}
              />
              <Ionicons name="lock-closed" size={14} color={colors.mutedForeground} />
            </View>
            <Text style={styles.fieldHint}>Email cannot be changed</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Ghana Phone Number</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+233 XX XXX XXXX"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 18, fontWeight: "700" as const, color: colors.text },
    scroll: { paddingHorizontal: 16 },
    avatarSection: { alignItems: "center", paddingVertical: 24 },
    avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    avatarLetter: { fontSize: 32, fontWeight: "700" as const, color: "#FFFFFF" },
    avatarName: { fontSize: 18, fontWeight: "600" as const, color: colors.text },
    errorBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF2F2", borderRadius: 10, padding: 12, marginBottom: 12, gap: 8 },
    errorText: { color: colors.destructive, fontSize: 13, flex: 1 },
    successBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0FFF4", borderRadius: 10, padding: 12, marginBottom: 12, gap: 8 },
    successText: { color: colors.success, fontSize: 13, flex: 1 },
    formCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, marginBottom: 20 },
    fieldGroup: { gap: 6 },
    fieldLabel: { fontSize: 13, fontWeight: "600" as const, color: colors.text },
    inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.muted, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
    disabledInput: { opacity: 0.6 },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, height: 46, fontSize: 15, color: colors.text },
    fieldHint: { fontSize: 11, color: colors.mutedForeground },
    saveBtn: { backgroundColor: colors.primary, borderRadius: 14, height: 54, alignItems: "center", justifyContent: "center" },
    saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const },
  });
}
