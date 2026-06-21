import { Ionicons } from "@expo/vector-icons";
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
import { getApiBase } from "@/utils/apiUrl";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+233");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${getApiBase()}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          role: "user",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Registration failed");
        return;
      }
      await login(data.token, data.user);
      router.replace("/(tabs)");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const styles = makeStyles(colors);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.secondary }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>

        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="car-sport" size={36} color={colors.primary} />
          </View>
          <Text style={styles.brand}>Swift Tow</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Get roadside help in minutes</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {[
            { label: "Full Name", value: name, setter: setName, icon: "person-outline", placeholder: "John Mensah", keyboard: "default" as const },
            { label: "Email", value: email, setter: setEmail, icon: "mail-outline", placeholder: "you@example.com", keyboard: "email-address" as const },
            { label: "Ghana Phone (+233)", value: phone, setter: setPhone, icon: "call-outline", placeholder: "+233 20 123 4567", keyboard: "phone-pad" as const },
            { label: "Password", value: password, setter: setPassword, icon: "lock-closed-outline", placeholder: "Min. 6 characters", keyboard: "default" as const },
          ].map((field) => (
            <View key={field.label} style={styles.inputGroup}>
              <Text style={styles.label}>{field.label}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name={field.icon as "person-outline"} size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={field.value}
                  onChangeText={field.setter}
                  keyboardType={field.keyboard}
                  autoCapitalize={field.label === "Email" ? "none" : "words"}
                  secureTextEntry={field.label === "Password"}
                  autoCorrect={false}
                />
              </View>
            </View>
          ))}

          <Pressable
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Create Account</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Already have an account?{" "}
              <Text style={styles.loginHighlight}>Sign In</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 24 },
    backBtn: { marginBottom: 16, alignSelf: "flex-start", padding: 4 },
    logoArea: { alignItems: "center", marginBottom: 24 },
    logoCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "rgba(255,107,0,0.15)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    brand: { fontSize: 22, fontWeight: "700" as const, color: "#FFFFFF" },
    card: { backgroundColor: colors.card, borderRadius: 20, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
    title: { fontSize: 22, fontWeight: "700" as const, color: colors.text, marginBottom: 4 },
    subtitle: { fontSize: 14, color: colors.mutedForeground, marginBottom: 20 },
    errorBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF2F2", borderRadius: 8, padding: 10, marginBottom: 16, gap: 6 },
    errorText: { fontSize: 13, color: colors.destructive, flex: 1 },
    inputGroup: { marginBottom: 14 },
    label: { fontSize: 13, fontWeight: "600" as const, color: colors.text, marginBottom: 6 },
    inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.muted, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, height: 46, fontSize: 15, color: colors.text },
    btn: { backgroundColor: colors.primary, borderRadius: 12, height: 52, alignItems: "center", justifyContent: "center", marginTop: 8, marginBottom: 16 },
    btnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const },
    loginLink: { alignItems: "center" },
    loginText: { fontSize: 14, color: colors.mutedForeground },
    loginHighlight: { color: colors.primary, fontWeight: "600" as const },
  });
}
