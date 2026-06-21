import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDriver, computeFare, haversineKm, TOW_PRICING } from "@/context/DriverContext";
import { useColors } from "@/hooks/useColors";
import DriverMapComponent from "@/components/DriverMapComponent";

const TOW_LABELS: Record<string, string> = {
  flatbed: "Flatbed Tow",
  hook_chain: "Hook & Chain Tow",
  repair: "Roadside Repair",
};

const TAB_BAR_HEIGHT = 80;

export default function ActiveTripScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeTrip, tripStatus, completeTrip, driverLocation } = useDriver();
  const mapRef = useRef<any>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const bottomPad = insets.bottom + TAB_BAR_HEIGHT;
  const styles = makeStyles(colors, bottomPad);

  const dropoff = activeTrip?.dropoffLocation ?? driverLocation ?? activeTrip?.pickupLocation ?? null;
  const distanceKm =
    activeTrip && dropoff
      ? haversineKm(
          activeTrip.pickupLocation.latitude,
          activeTrip.pickupLocation.longitude,
          dropoff.latitude,
          dropoff.longitude
        )
      : 0;
  const fare =
    activeTrip && dropoff
      ? computeFare(activeTrip.pickupLocation, dropoff, activeTrip.towType)
      : 0;

  if (!activeTrip || tripStatus === "idle") {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
        <MaterialCommunityIcons name="truck-check" size={72} color={colors.border} />
        <Text style={styles.emptyTitle}>No Active Trip</Text>
        <Text style={styles.emptyText}>Accept a request from the dashboard to start a trip.</Text>
      </View>
    );
  }

  if (tripStatus === "completed") {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.emptyTitle}>Trip Completed!</Text>
        <Text style={styles.emptyText}>Payment request sent to customer. Great work!</Text>
      </View>
    );
  }

  const handleCall = () => {
    if (Platform.OS !== "web") {
      Linking.openURL(`tel:${activeTrip.userPhone}`);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsCompleting(true);
    setTimeout(() => {
      completeTrip();
      setIsCompleting(false);
    }, 800);
  };

  return (
    <View style={styles.container}>
      <DriverMapComponent
        mapRef={mapRef}
        driverLocation={driverLocation}
        requestLocation={activeTrip.pickupLocation}
        colors={colors}
      />

      <View style={[styles.topBadge, { top: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <View style={styles.topBadgeInner}>
          <View style={styles.pulseDot} />
          <Text style={styles.topBadgeText}>
            {tripStatus === "accepted" ? "Heading to Pickup" : "Trip in Progress"}
          </Text>
        </View>
      </View>

      <View style={[styles.bottomPanel, { paddingBottom: bottomPad }]}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.handleBar} />

          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerInitial}>{activeTrip.userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{activeTrip.userName}</Text>
              <Text style={styles.customerPhone}>{activeTrip.userPhone}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.8 }]}
              onPress={handleCall}
            >
              <Ionicons name="call" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <MaterialCommunityIcons name="truck-flatbed" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Tow Type</Text>
                <Text style={styles.detailValue}>{TOW_LABELS[activeTrip.towType]}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="location" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Pickup Address</Text>
                <Text style={styles.detailValue} numberOfLines={2}>{activeTrip.pickupAddress}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="car" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Vehicle</Text>
                <Text style={styles.detailValue}>{activeTrip.vehicleDetails}</Text>
              </View>
            </View>
          </View>

          <View style={styles.fareCard}>
            <View style={styles.fareRow}>
              <View>
                <Text style={styles.fareLabel}>Fare ({activeTrip ? TOW_PRICING[activeTrip.towType].label : "GHS 20 / km"})</Text>
                <Text style={styles.fareDistance}>{distanceKm.toFixed(2)} km</Text>
              </View>
              <Text style={styles.fareAmount}>GHS {fare.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.completeCard}>
            <Pressable
              style={({ pressed }) => [styles.completeBtn, pressed && { opacity: 0.88 }]}
              onPress={handleComplete}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.completeBtnText}>Complete Trip · GHS {fare.toFixed(2)}</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, bottomPad: number) {
  return StyleSheet.create({
    container: { flex: 1 },
    emptyContainer: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      gap: 12,
    },
    emptyTitle: { fontSize: 22, fontWeight: "700" as const, color: colors.text },
    emptyText: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 },
    successCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.success,
      alignItems: "center",
      justifyContent: "center",
    },
    topBadge: { position: "absolute", left: 16, right: 16 },
    topBadgeInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.secondary,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 10,
      alignSelf: "flex-start",
    },
    pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
    topBadgeText: { color: "#FFFFFF", fontWeight: "600" as const, fontSize: 13 },
    bottomPanel: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 16,
      paddingTop: 12,
      maxHeight: "65%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 12,
    },
    handleBar: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 16,
    },
    customerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 16,
    },
    customerAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    customerInitial: { fontSize: 20, fontWeight: "700" as const, color: "#FFFFFF" },
    customerName: { fontSize: 16, fontWeight: "700" as const, color: colors.text },
    customerPhone: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
    callBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.success,
      alignItems: "center",
      justifyContent: "center",
    },
    detailsCard: {
      backgroundColor: colors.muted,
      borderRadius: 16,
      padding: 16,
      gap: 12,
      marginBottom: 16,
    },
    detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    detailIcon: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    detailLabel: { fontSize: 11, color: colors.mutedForeground, marginBottom: 2 },
    detailValue: { fontSize: 14, color: colors.text, fontWeight: "500" as const },
    fareCard: {
      backgroundColor: colors.secondary,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    fareRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    fareLabel: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 4 },
    fareDistance: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
    fareAmount: { fontSize: 32, fontWeight: "700" as const, color: "#FFFFFF" },
    completeCard: {
      marginBottom: 8,
    },
    completeBtn: {
      backgroundColor: colors.success,
      borderRadius: 14,
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    completeBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const },
  });
}
