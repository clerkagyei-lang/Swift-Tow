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

const VEHICLE_TYPES = ["Flatbed", "Hook & Chain", "Wheel-Lift", "Integrated"];

export default function RegisterDriverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+233");
  const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim() || !vehicleType || !vehiclePlate.trim() || !licenseNumber.trim()) {
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
      const res = await fetch(`${getApiBase()}/api/auth/register-driver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          vehicleType,
          vehiclePlate: vehiclePlate.trim().toUpperCase(),
          licenseNumber: licenseNumber.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Registration failed");
        return;
      }
      await login(data.token, data.user);
      router.replace("/auth/pending-approval" as any);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Error: ${msg}`);
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
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="car" size={36} color={colors.primary} />
          </View>
          <Text style={styles.brand}>Driver Registration</Text>
          <Text style={styles.tagline}>Join the Swift Tow fleet</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <Ionicons name="information-circle-outline" size={15} color={colors.primary} />
            <Text style={styles.badgeText}>Your account will be reviewed before you can start driving</Text>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.sectionLabel}>Personal Info</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="John Mensah" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} autoCapitalize="words" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={colors.mutedForeground} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ghana Phone (+233)</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="+233 20 123 4567" placeholderTextColor={colors.mutedForeground} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Min. 6 characters" placeholderTextColor={colors.mutedForeground} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Vehicle Info</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Type</Text>
            <Pressable style={styles.inputWrap} onPress={() => setShowVehiclePicker(!showVehiclePicker)}>
              <Ionicons name="car-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <Text style={[styles.input, { lineHeight: 48, color: vehicleType ? colors.text : colors.mutedForeground }]}>
                {vehicleType || "Select vehicle type"}
              </Text>
              <Ionicons name={showVehiclePicker ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
            </Pressable>
            {showVehiclePicker && (
              <View style={styles.picker}>
                {VEHICLE_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.pickerItem, vehicleType === type && { backgroundColor: colors.primary + "18" }]}
                    onPress={() => { setVehicleType(type); setShowVehiclePicker(false); }}
                  >
                    <Text style={[styles.pickerItemText, vehicleType === type && { color: colors.primary, fontWeight: "600" as const }]}>{type}</Text>
                    {vehicleType === type && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Plate Number</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="id-card-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="GR-1234-20" placeholderTextColor={colors.mutedForeground} value={vehiclePlate} onChangeText={setVehiclePlate} autoCapitalize="characters" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Driver's License Number</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="document-text-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="GHA-DL-XXXXXXX" placeholderTextColor={colors.mutedForeground} value={licenseNumber} onChangeText={setLicenseNumber} autoCapitalize="characters" />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.btnContent}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.btnText}>Submit Application</Text>
              </View>
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
    backBtn: { marginBottom: 12, alignSelf: "flex-start", padding: 4 },
    headerArea: { alignItems: "center", marginBottom: 20 },
    logoCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(255,107,0,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 10 },
    brand: { fontSize: 22, fontWeight: "700" as const, color: "#FFFFFF" },
    tagline: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 },
    card: { backgroundColor: colors.card, borderRadius: 20, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
    badgeRow: { flexDirection: "row", alignItems: "flex-start", backgroundColor: colors.primary + "12", borderRadius: 8, padding: 10, marginBottom: 16, gap: 6 },
    badgeText: { fontSize: 12, color: colors.primary, flex: 1, lineHeight: 18 },
    sectionLabel: { fontSize: 11, fontWeight: "700" as const, color: colors.mutedForeground, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 },
    errorBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF2F2", borderRadius: 8, padding: 10, marginBottom: 16, gap: 6 },
    errorText: { fontSize: 13, color: colors.destructive, flex: 1 },
    inputGroup: { marginBottom: 13 },
    label: { fontSize: 13, fontWeight: "600" as const, color: colors.text, marginBottom: 6 },
    inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.muted, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, height: 48, fontSize: 15, color: colors.text },
    eyeBtn: { padding: 4 },
    picker: { backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginTop: 4, overflow: "hidden" },
    pickerItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
    pickerItemText: { fontSize: 14, color: colors.text },
    btn: { backgroundColor: colors.primary, borderRadius: 12, height: 52, alignItems: "center", justifyContent: "center", marginTop: 12, marginBottom: 16 },
    btnContent: { flexDirection: "row", alignItems: "center", gap: 8 },
    btnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const },
    loginLink: { alignItems: "center" },
    loginText: { fontSize: 14, color: colors.mutedForeground },
    loginHighlight: { color: colors.primary, fontWeight: "600" as const },
  });
}
