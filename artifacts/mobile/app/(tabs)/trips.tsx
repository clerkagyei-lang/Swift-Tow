import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useTow } from "@/context/TowContext";
import { useListTrips } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

const TOW_LABELS: Record<string, string> = {
  flatbed: "Flatbed",
  hook_chain: "Hook & Chain",
  repair: "Repair",
};

const PAYMENT_LABELS: Record<string, string> = {
  mtn_momo: "MTN MoMo",
  telecel_cash: "Telecel Cash",
  at_money: "AT Money",
  cash: "Cash",
  null: "Pending",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" });
}

export default function TripsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { towStatus, activeRequest, driverLocation } = useTow();
  const isActiveTrip = towStatus === "accepted" || towStatus === "in_progress";
  const { data: trips, isLoading, refetch } = useListTrips(
    { userId: user?.id ?? "" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: !!user?.id } as any }
  );

  const styles = makeStyles(colors);

  const renderTrip = ({ item }: { item: NonNullable<typeof trips>[0] }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: colors.accent }]}>
          <MaterialCommunityIcons
            name={item.towType === "flatbed" ? "truck-flatbed" : item.towType === "hook_chain" ? "car-traction-control" : "wrench"}
            size={14}
            color={colors.primary}
          />
          <Text style={styles.typeBadgeText}>{TOW_LABELS[item.towType]}</Text>
        </View>
        <View style={[styles.statusBadge, item.paymentStatus === "paid" ? styles.paidBadge : styles.pendingBadge]}>
          <Text style={styles.statusText}>{item.paymentStatus === "paid" ? "Paid" : "Pending"}</Text>
        </View>
      </View>

      <View style={styles.routeRow}>
        <View style={styles.routeDot} />
        <View style={styles.routeInfo}>
          <Text style={styles.routeAddr} numberOfLines={1}>{item.pickupAddress}</Text>
          {item.dropoffAddress && (
            <>
              <View style={styles.routeLine} />
              <Text style={styles.routeAddr} numberOfLines={1}>{item.dropoffAddress}</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerRow}>
          <Ionicons name="car-outline" size={14} color={colors.mutedForeground} />
          <Text style={styles.footerText}>{item.vehicleDetails}</Text>
        </View>
        <View style={styles.footerRow}>
          <Ionicons name="person-outline" size={14} color={colors.mutedForeground} />
          <Text style={styles.footerText}>{item.driverName}</Text>
        </View>
        <View style={styles.footerRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.mutedForeground} />
          <Text style={styles.footerText}>{formatDate(item.completedAt)}</Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <View style={styles.footerRow}>
          <Ionicons name="wallet-outline" size={14} color={colors.mutedForeground} />
          <Text style={styles.footerText}>{PAYMENT_LABELS[item.paymentMethod ?? "null"]}</Text>
        </View>
        <Text style={styles.amount}>GHS {item.amount.toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? insets.top + 67 : 0 }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Trips</Text>
        <Pressable onPress={() => refetch()}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {isActiveTrip && (
        <Pressable
          style={[styles.activeTrackBanner, { borderColor: colors.primary }]}
          onPress={() => router.push("/active-request")}
        >
          <View style={styles.activeTrackLeft}>
            <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
            <View>
              <Text style={[styles.activeTrackTitle, { color: colors.primary }]}>
                {towStatus === "in_progress" ? "Driver En Route" : "Driver Assigned"}
              </Text>
              <Text style={[styles.activeTrackSub, { color: colors.mutedForeground }]}>
                {driverLocation ? "Live GPS tracking active" : activeRequest?.pickupAddress ?? "Tap to track your driver"}
              </Text>
            </View>
          </View>
          <View style={[styles.trackBtn, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="truck-fast" size={16} color="#fff" />
            <Text style={styles.trackBtnText}>Track</Text>
          </View>
        </Pressable>
      )}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !trips?.length ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="truck-outline" size={56} color={colors.border} />
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptyText}>Your completed tow trips will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={renderTrip}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 22, fontWeight: "700" as const, color: colors.text },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: "700" as const, color: colors.text },
    emptyText: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", paddingHorizontal: 32 },
    list: { padding: 16, gap: 12 },
    activeTrackBanner: {
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: colors.accent,
      borderRadius: 14,
      borderWidth: 1.5,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    activeTrackLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    activeDot: { width: 10, height: 10, borderRadius: 5 },
    activeTrackTitle: { fontSize: 14, fontWeight: "700" as const },
    activeTrackSub: { fontSize: 12, marginTop: 2 },
    trackBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
    },
    trackBtnText: { color: "#fff", fontWeight: "700" as const, fontSize: 13 },
    card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    typeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    typeBadgeText: { fontSize: 12, fontWeight: "600" as const, color: colors.primary },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    paidBadge: { backgroundColor: "#E8F5E9" },
    pendingBadge: { backgroundColor: "#FFF8E1" },
    statusText: { fontSize: 12, fontWeight: "600" as const, color: colors.text },
    routeRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
    routeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 5 },
    routeInfo: { flex: 1 },
    routeLine: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
    routeAddr: { fontSize: 14, color: colors.text, fontWeight: "500" as const },
    cardFooter: { gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, marginBottom: 10 },
    amountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    footerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    footerText: { fontSize: 13, color: colors.mutedForeground },
    amount: { fontSize: 18, fontWeight: "700" as const, color: colors.primary },
  });
}
