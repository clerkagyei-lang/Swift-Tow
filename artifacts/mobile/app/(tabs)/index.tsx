import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useTow } from "@/context/TowContext";
import { useColors } from "@/hooks/useColors";
import MapComponent from "@/components/MapComponent";
import LocationSearchInput, { type SelectedLocation } from "@/components/LocationSearchInput";
import { haversineKm, computeFare } from "@/context/DriverContext";

type TowType = "flatbed" | "hook_chain" | "repair";

const TOW_TYPES: { id: TowType; label: string; icon: string; desc: string }[] = [
  { id: "flatbed", label: "Flatbed", icon: "truck-flatbed", desc: "Luxury & AWD" },
  { id: "hook_chain", label: "Hook & Chain", icon: "car-traction-control", desc: "Standard tow" },
  { id: "repair", label: "Repair", icon: "wrench", desc: "On-site fix" },
];

const ACCRA = { latitude: 5.6037, longitude: -0.187 };
const TAB_BAR_HEIGHT = 80;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { towStatus, setTowStatus, setActiveRequest } = useTow();

  const [pickupLocation, setPickupLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pickupAddress, setPickupAddress] = useState("Locating you...");
  const [dropoffLocation, setDropoffLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [selectedTow, setSelectedTow] = useState<TowType>("flatbed");
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (towStatus === "searching") {
      router.push("/searching");
    } else if (towStatus === "accepted" || towStatus === "in_progress") {
      router.push("/active-request");
    }
  }, [towStatus]);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      if (Platform.OS === "web") {
        setPickupLocation(ACCRA);
        setPickupAddress("Accra, Greater Accra Region, Ghana");
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPickupLocation(ACCRA);
        setPickupAddress("Accra, Ghana");
        return;
      }

      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = initial.coords;
      setPickupLocation({ latitude, longitude });

      try {
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo[0]) {
          const g = geo[0];
          setPickupAddress([g.street, g.district, g.city].filter(Boolean).join(", ") || "Current Location");
        }
      } catch {
        setPickupAddress("Current Location");
      }

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 4000, distanceInterval: 8 },
        (pos) => {
          setPickupLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        }
      );
    })();

    return () => { sub?.remove(); };
  }, []);

  const estimatedDistanceKm =
    pickupLocation && dropoffLocation
      ? haversineKm(
          pickupLocation.latitude,
          pickupLocation.longitude,
          dropoffLocation.latitude,
          dropoffLocation.longitude
        )
      : null;

  const estimatedFare =
    pickupLocation && dropoffLocation
      ? computeFare(pickupLocation, dropoffLocation)
      : null;

  const handleConfirmRequest = async () => {
    if (!user || !pickupLocation || isSearching) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSearching(true);

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
          pickupLocation,
          pickupAddress,
          dropoffLocation: dropoffLocation ?? null,
          dropoffAddress: dropoffAddress || null,
          vehicleDetails: "My Vehicle",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveRequest(data);
        setTowStatus("searching");
      } else {
        setIsSearching(false);
      }
    } catch {
      setIsSearching(false);
    }
  };

  const handlePickupSelect = (loc: SelectedLocation) => {
    setPickupLocation({ latitude: loc.latitude, longitude: loc.longitude });
    setPickupAddress(loc.address);
  };

  const handleDropoffSelect = (loc: SelectedLocation) => {
    setDropoffLocation({ latitude: loc.latitude, longitude: loc.longitude });
    setDropoffAddress(loc.address);
  };

  const bottomPad = insets.bottom + TAB_BAR_HEIGHT;
  const styles = makeStyles(colors, bottomPad);

  return (
    <View style={styles.container}>
      <MapComponent
        mapRef={mapRef}
        location={pickupLocation}
        dropoffLocation={dropoffLocation}
        driverLocation={null}
        colors={colors}
        followUser={true}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 10) }]}>
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hi, {user?.name?.split(" ")[0]}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={13} color={colors.primary} />
              <Text style={styles.locationText} numberOfLines={1}>{pickupAddress}</Text>
            </View>
          </View>
          <Pressable onPress={() => router.push("/help")} style={styles.helpBtn}>
            <Ionicons name="headset" size={20} color={colors.secondary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.bottomPanel}>
        <ScrollView
          contentContainerStyle={styles.panelContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.handleBar} />

          {/* Route card */}
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <Text style={styles.routeLabel}>Pickup</Text>
              <LocationSearchInput
                label="pickup"
                iconColor="#4A90E2"
                value={pickupAddress}
                onSelect={handlePickupSelect}
                placeholder="Search pickup location..."
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.routeRow}>
              <Text style={styles.routeLabel}>Drop-off</Text>
              <LocationSearchInput
                label="drop-off"
                iconColor={colors.primary}
                value={dropoffAddress}
                onSelect={handleDropoffSelect}
                onClear={() => { setDropoffLocation(null); setDropoffAddress(""); }}
                placeholder="Where to? (optional)"
              />
            </View>
          </View>

          {/* Fare estimate */}
          {estimatedFare !== null && estimatedDistanceKm !== null && (
            <View style={styles.fareEstimate}>
              <View style={styles.fareLeft}>
                <Ionicons name="speedometer-outline" size={16} color={colors.primary} />
                <Text style={styles.fareDistText}>{estimatedDistanceKm.toFixed(1)} km</Text>
              </View>
              <Text style={styles.fareText}>Est. GHS {estimatedFare.toFixed(2)}</Text>
            </View>
          )}

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
                <Text style={[styles.towLabel, selectedTow === type.id && styles.towLabelActive]}>
                  {type.label}
                </Text>
                <Text style={styles.towDesc}>{type.desc}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.confirmBtn,
              (isSearching || !pickupLocation) && styles.confirmBtnDisabled,
              pressed && !isSearching && { opacity: 0.88 },
            ]}
            onPress={handleConfirmRequest}
            disabled={isSearching || !pickupLocation}
          >
            <View style={styles.confirmBtnContent}>
              {isSearching ? (
                <>
                  <Ionicons name="radio-button-on" size={18} color="#fff" />
                  <Text style={styles.confirmBtnText}>Finding Driver...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="navigate" size={18} color="#fff" />
                  <Text style={styles.confirmBtnText}>
                    Request Tow{estimatedFare !== null ? `  ·  GHS ${estimatedFare.toFixed(2)}` : ""}
                  </Text>
                </>
              )}
            </View>
          </Pressable>

        </ScrollView>
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, bottomPad: number) {
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
      backgroundColor: "rgba(255,255,255,0.97)",
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 5,
    },
    greeting: { fontSize: 15, fontWeight: "700" as const, color: colors.text },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
    locationText: { fontSize: 12, color: colors.mutedForeground, flex: 1 },
    helpBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 10,
    },
    bottomPanel: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "72%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 12,
    },
    panelContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: bottomPad,
    },
    handleBar: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 14,
    },
    routeCard: {
      backgroundColor: colors.muted,
      borderRadius: 16,
      paddingHorizontal: 14,
      marginBottom: 10,
    },
    routeRow: {
      paddingVertical: 2,
    },
    routeLabel: {
      fontSize: 10,
      fontWeight: "600" as const,
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: 8,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: 20,
    },
    fareEstimate: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 12,
    },
    fareLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
    fareDistText: { fontSize: 13, color: colors.primary, fontWeight: "600" as const },
    fareText: { fontSize: 14, fontWeight: "700" as const, color: colors.primary },
    panelTitle: { fontSize: 13, fontWeight: "700" as const, color: colors.mutedForeground, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
    towTypes: { flexDirection: "row", gap: 10, marginBottom: 14 },
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
    towLabel: { fontSize: 11, fontWeight: "600" as const, color: colors.mutedForeground, textAlign: "center" },
    towLabelActive: { color: colors.primary },
    towDesc: { fontSize: 10, color: colors.mutedForeground, textAlign: "center" },
    confirmBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      height: 54,
      alignItems: "center",
      justifyContent: "center",
    },
    confirmBtnDisabled: { backgroundColor: colors.mutedForeground },
    confirmBtnContent: { flexDirection: "row", alignItems: "center", gap: 8 },
    confirmBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" as const },
    cancelBtn: { alignItems: "center", paddingVertical: 12 },
    cancelText: { color: colors.destructive, fontWeight: "600" as const, fontSize: 14 },
  });
}
