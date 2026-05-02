import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useTow } from "@/context/TowContext";
import { useColors } from "@/hooks/useColors";
import MapComponent from "@/components/MapComponent";

type TowType = "flatbed" | "hook_chain" | "repair";

const TOW_TYPES: { id: TowType; label: string; icon: string; desc: string; price: string }[] = [
  { id: "flatbed", label: "Flatbed", icon: "truck-flatbed", desc: "Best for luxury & AWD", price: "GHS 200–300" },
  { id: "hook_chain", label: "Hook & Chain", icon: "car-traction-control", desc: "Standard tow", price: "GHS 120–180" },
  { id: "repair", label: "Repair", icon: "wrench", desc: "On-site assistance", price: "GHS 80–150" },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { towStatus, setTowStatus, setActiveRequest } = useTow();

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState("Locating you...");
  const [selectedTow, setSelectedTow] = useState<TowType>("flatbed");
  const [isSearching, setIsSearching] = useState(false);
  const searchingOpacity = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<any>(null);

  const ACCRA = { latitude: 5.6037, longitude: -0.187, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  useEffect(() => {
    (async () => {
      if (Platform.OS === "web") {
        setLocation({ latitude: ACCRA.latitude, longitude: ACCRA.longitude });
        setAddress("Accra, Greater Accra Region, Ghana");
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocation({ latitude: ACCRA.latitude, longitude: ACCRA.longitude });
        setAddress("Accra, Ghana");
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = loc.coords;
        setLocation({ latitude, longitude });
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo[0]) {
          const g = geo[0];
          setAddress([g.street, g.district, g.city].filter(Boolean).join(", ") || "Current Location");
        }
      } catch {
        setLocation({ latitude: ACCRA.latitude, longitude: ACCRA.longitude });
        setAddress("Accra, Ghana");
      }
    })();
  }, []);

  useEffect(() => {
    if (towStatus === "accepted" || towStatus === "in_progress") {
      router.push("/active-request");
    }
  }, [towStatus]);

  const handleConfirmRequest = async () => {
    if (!user || !location) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSearching(true);
    setTowStatus("searching");

    Animated.loop(
      Animated.sequence([
        Animated.timing(searchingOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(searchingOpacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "localhost";
      const res = await fetch(`https://${domain}/api/tow-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          userPhone: user.phone,
          towType: selectedTow,
          pickupLocation: location,
          pickupAddress: address,
          vehicleDetails: "My Vehicle",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveRequest(data);
        setTimeout(() => {
          setTowStatus("accepted");
          setIsSearching(false);
          router.push("/active-request");
        }, 4000);
      }
    } catch {
      setIsSearching(false);
      setTowStatus("idle");
    }
  };

  const cancelSearch = () => {
    setIsSearching(false);
    setTowStatus("idle");
    searchingOpacity.setValue(0);
  };

  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <MapComponent mapRef={mapRef} location={location} colors={colors} />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>Hi, {user?.name?.split(" ")[0]}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color={colors.primary} />
              <Text style={styles.locationText} numberOfLines={1}>{address}</Text>
            </View>
          </View>
          <Pressable onPress={() => router.push("/help")} style={styles.helpBtn}>
            <Ionicons name="headset" size={20} color={colors.secondary} />
          </Pressable>
        </View>
      </View>

      {/* Bottom panel */}
      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) }]}>
        <Text style={styles.panelTitle}>Select Tow Type</Text>
        <View style={styles.towTypes}>
          {TOW_TYPES.map((type) => (
            <Pressable
              key={type.id}
              style={[styles.towCard, selectedTow === type.id && styles.towCardActive]}
              onPress={() => { setSelectedTow(type.id); Haptics.selectionAsync(); }}
            >
              <MaterialCommunityIcons
                name={type.icon as "truck-flatbed"}
                size={26}
                color={selectedTow === type.id ? colors.primary : colors.mutedForeground}
              />
              <Text style={[styles.towLabel, selectedTow === type.id && styles.towLabelActive]}>{type.label}</Text>
              <Text style={styles.towPrice}>{type.price}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.9 }, isSearching && styles.confirmBtnDisabled]}
          onPress={handleConfirmRequest}
          disabled={isSearching || !location}
        >
          {isSearching ? (
            <View style={styles.confirmBtnContent}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.confirmBtnText}>Finding Driver...</Text>
            </View>
          ) : (
            <View style={styles.confirmBtnContent}>
              <Ionicons name="navigate" size={18} color="#fff" />
              <Text style={styles.confirmBtnText}>Request Tow</Text>
            </View>
          )}
        </Pressable>

        {isSearching && (
          <Pressable onPress={cancelSearch} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel Request</Text>
          </Pressable>
        )}
      </View>

      {/* Searching overlay */}
      {isSearching && (
        <View style={[StyleSheet.absoluteFill, styles.overlay]}>
          <Animated.View style={[styles.searchingCard, { opacity: searchingOpacity }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.searchingTitle}>Searching for Driver</Text>
            <Text style={styles.searchingText}>We're finding the nearest tow truck for you...</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    topBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    greetingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "rgba(255,255,255,0.95)",
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    greeting: { fontSize: 16, fontWeight: "700" as const, color: colors.text },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
    locationText: { fontSize: 12, color: colors.mutedForeground, maxWidth: 220 },
    helpBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    bottomPanel: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 16,
      paddingTop: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 10,
    },
    panelTitle: { fontSize: 16, fontWeight: "700" as const, color: colors.text, marginBottom: 14 },
    towTypes: { flexDirection: "row", gap: 10, marginBottom: 16 },
    towCard: {
      flex: 1,
      backgroundColor: colors.muted,
      borderRadius: 14,
      padding: 12,
      alignItems: "center",
      gap: 4,
      borderWidth: 2,
      borderColor: "transparent",
    },
    towCardActive: { borderColor: colors.primary, backgroundColor: colors.accent },
    towLabel: { fontSize: 12, fontWeight: "600" as const, color: colors.mutedForeground, textAlign: "center" },
    towLabelActive: { color: colors.primary },
    towPrice: { fontSize: 10, color: colors.mutedForeground, textAlign: "center" },
    confirmBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      height: 54,
      alignItems: "center",
      justifyContent: "center",
    },
    confirmBtnDisabled: { backgroundColor: colors.mutedForeground },
    confirmBtnContent: { flexDirection: "row", alignItems: "center", gap: 8 },
    confirmBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const },
    cancelBtn: { alignItems: "center", paddingVertical: 12 },
    cancelText: { color: colors.destructive, fontWeight: "600" as const },
    overlay: {
      backgroundColor: "rgba(26,26,46,0.7)",
      alignItems: "center",
      justifyContent: "center",
    },
    searchingCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 20,
      padding: 32,
      alignItems: "center",
      margin: 32,
      gap: 12,
    },
    searchingTitle: { fontSize: 20, fontWeight: "700" as const, color: colors.text },
    searchingText: { fontSize: 14, color: colors.mutedForeground, textAlign: "center" },
  });
}
