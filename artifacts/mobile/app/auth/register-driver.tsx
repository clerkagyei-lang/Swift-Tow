import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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

const VEHICLE_TYPES = ["Flatbed Tow Truck", "Hook & Chain Truck", "Wheel-Lift Truck", "Integrated Truck", "Roadside Repair Van"];

export default function RegisterDriverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+233");
  const [password, setPassword] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[0]);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim() || !licenseNumber.trim() || !vehiclePlate.trim()) {
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
      const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "localhost";
      const res = await fetch(`https://${domain}/api/auth/register-driver`, {
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
      // _layout will redirect to pending-approval based on approvalStatus
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
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>

        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="truck-fast" size={36} color={colors.primary} />
          </View>
          <Text style={styles.brand}>Swift Tow</Text>
          <Text style={styles.tagline}>Driver Application</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Register as Driver</Text>
          <Text style={styles.subtitle}>Your account will be reviewed before activation</Text>

          <View style={styles.noticeBanner}>
            <Ionicons name="information-circle" size={18} color="#B45309" />
            <Text style={styles.noticeText}>After submitting, our team will verify your license and vehicle details. This typically takes 1–2 business days.</Text>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.sectionLabel}>Personal Information</Text>

          {[
            { label: "Full Name", value: name, setter: setName, icon: "person-outline", placeholder: "Kwame Mensah", keyboard: "default" as const },
            { label: "Email Address", value: email, setter: setEmail, icon: "mail-outline", placeholder: "driver@example.com", keyboard: "email-address" as const },
            { label: "Ghana Phone (+233)", value: phone, setter: setPhone, icon: "call-outline", placeholder: "+233 24 456 7890", keyboard: "phone-pad" as const },
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
                  autoCapitalize={field.label === "Email Address" || field.label === "Password" ? "none" : "words"}
                  secureTextEntry={field.label === "Password"}
                  autoCorrect={false}
                />
              </View>
            </View>
          ))}

          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Vehicle & License</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Type</Text>
            <Pressable style={styles.inputWrap} onPress={() => setShowVehiclePicker(!showVehiclePicker)}>
              <MaterialCommunityIcons name="truck" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <Text style={[styles.input, { lineHeight: 46, color: colors.text }]}>{vehicleType}</Text>
              <Ionicons name={showVehiclePicker ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
            </Pressable>
            {showVehiclePicker && (
              <View style={styles.picker}>
                {VEHICLE_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.pickerItem, vehicleType === type && styles.pickerItemActive]}
                    onPress={() => { setVehicleType(type); setShowVehiclePicker(false); }}
                  >
                    <Text style={[styles.pickerItemText, vehicleType === type && { color: colors.primary, fontWeight: "700" as const }]}>{type}</Text>
                    {vehicleType === type && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {[
            { label: "Vehicle Plate Number", value: vehiclePlate, setter: setVehiclePlate, icon: "card-outline", placeholder: "GR 4421-22" },
            { label: "Driver's License Number", value: licenseNumber, setter: setLicenseNumber, icon: "id-card-outline", placeholder: "GHA-DL-2020-00441" },
          ].map((field) => (
            <View key={field.label} style={styles.inputGroup}>
              <Text style={styles.label}>{field.label}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name={field.icon as "card-outline"} size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={field.value}
                  onChangeText={field.setter}
                  autoCapitalize="characters"
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
              <>
                <MaterialCommunityIcons name="send" size={18} color="#fff" />
                <Text style={styles.btnText}>Submit Application</Text>
              </>
            )}
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginHighlight}>Sign In</Text>
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
    logoArea: { alignItems: "center", marginBottom: 20 },
    logoCircle: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: "rgba(255,107,0,0.15)",
      alignItems: "center", justifyContent: "center", marginBottom: 8,
    },
    brand: { fontSize: 22, fontWeight: "700" as const, color: "#FFFFFF" },
    tagline: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 2 },
    card: { backgroundColor: colors.card, borderRadius: 20, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
    title: { fontSize: 20, fontWeight: "700" as const, color: colors.text, marginBottom: 4 },
    subtitle: { fontSize: 13, color: colors.mutedForeground, marginBottom: 16 },
    noticeBanner: { flexDirection: "row", gap: 8, backgroundColor: "#FEF3C7", borderRadius: 10, padding: 12, marginBottom: 16 },
    noticeText: { fontSize: 12, color: "#92400E", flex: 1, lineHeight: 18 },
    errorBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF2F2", borderRadius: 8, padding: 10, marginBottom: 12, gap: 6 },
    errorText: { fontSize: 13, color: colors.destructive, flex: 1 },
    sectionLabel: { fontSize: 11, fontWeight: "700" as const, color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
    inputGroup: { marginBottom: 12 },
    label: { fontSize: 13, fontWeight: "600" as const, color: colors.text, marginBottom: 6 },
    inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.muted, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, height: 46, fontSize: 15, color: colors.text },
    picker: { backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginTop: 4, overflow: "hidden" },
    pickerItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    pickerItemActive: { backgroundColor: `${colors.primary}10` },
    pickerItemText: { fontSize: 14, color: colors.text },
    btn: { backgroundColor: colors.primary, borderRadius: 12, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, marginBottom: 16 },
    btnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const },
    loginLink: { alignItems: "center" },
    loginText: { fontSize: 14, color: colors.mutedForeground },
    loginHighlight: { color: colors.primary, fontWeight: "600" as const },
  });
}
