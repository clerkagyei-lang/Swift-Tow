import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { useColors } from "@/hooks/useColors";
import { getApiBase } from "@/utils/apiUrl";

const TAB_BAR_HEIGHT = 80;

const TOW_ICONS: Record<string, string> = {
  flatbed: "truck-flatbed",
  hook_chain: "car-traction-control",
  repair: "wrench",
};

interface Trip {
  id: string;
  towType: string;
  amount: number | null;
  pickupAddress: string;
  dropoffAddress: string | null;
  driverName: string;
  paymentStatus: string;
  completedAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function EarningsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { earningsToday } = useDriver();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetchTrips = async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/trips?driverId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setTrips(Array.isArray(data) ? data : []);
        }
      } catch {
        // ignore fetch errors
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [user?.id]);

  const weekTotal = trips
    .filter((t) => Date.now() - new Date(t.completedAt).getTime() < 7 * 86400000)
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);

  const monthTotal = trips
    .filter((t) => Date.now() - new Date(t.completedAt).getTime() < 30 * 86400000)
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);

  const styles = makeStyles(colors);

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Earnings</Text>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="cash" size={22} color="rgba(255,255,255,0.8)" />
            <Text style={styles.summaryAmount}>GHS {earningsToday.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Today</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name="calendar-week" size={22} color="rgba(255,255,255,0.8)" />
            <Text style={styles.summaryAmount}>GHS {weekTotal.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>This Week</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.success }]}>
            <MaterialCommunityIcons name="calendar-month" size={22} color="rgba(255,255,255,0.8)" />
            <Text style={styles.summaryAmount}>GHS {monthTotal.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>This Month</Text>
          </View>
        </View>

        {/* Performance */}
        <View style={styles.perfCard}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.perfRow}>
            <View style={styles.perfItem}>
              <Ionicons name="star" size={20} color={colors.warning} />
              <Text style={styles.perfValue}>4.8</Text>
              <Text style={styles.perfLabel}>Rating</Text>
            </View>
            <View style={styles.perfDivider} />
            <View style={styles.perfItem}>
              <MaterialCommunityIcons name="truck-check" size={20} color={colors.primary} />
              <Text style={styles.perfValue}>{trips.length}</Text>
              <Text style={styles.perfLabel}>Total Trips</Text>
            </View>
            <View style={styles.perfDivider} />
            <View style={styles.perfItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.perfValue}>
                {trips.length > 0
                  ? `${Math.round((trips.filter((t) => t.paymentStatus === "paid").length / trips.length) * 100)}%`
                  : "—"}
              </Text>
              <Text style={styles.perfLabel}>Paid</Text>
            </View>
          </View>
        </View>

        {/* Recent trips */}
        <Text style={styles.sectionTitle}>Recent Trips</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : trips.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="truck-check" size={40} color={colors.border} />
            <Text style={styles.emptyText}>No trips yet. Complete a job to see it here.</Text>
          </View>
        ) : (
          trips.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripIconWrap}>
                <MaterialCommunityIcons
                  name={(TOW_ICONS[trip.towType] ?? "truck") as "truck-flatbed"}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tripAddress} numberOfLines={1}>
                  {trip.pickupAddress}{trip.dropoffAddress ? ` → ${trip.dropoffAddress}` : ""}
                </Text>
                <Text style={styles.tripTime}>{timeAgo(trip.completedAt)}</Text>
              </View>
              <View style={styles.tripRight}>
                <Text style={styles.tripAmount}>GHS {(trip.amount ?? 0).toFixed(2)}</Text>
                <View style={[styles.paidBadge, trip.paymentStatus !== "paid" && styles.pendingBadge]}>
                  <Text style={[styles.paidText, trip.paymentStatus !== "paid" && styles.pendingText]}>
                    {trip.paymentStatus === "paid" ? "Paid" : "Pending"}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    screenTitle: {
      fontSize: 26,
      fontWeight: "800" as const,
      color: colors.text,
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 16,
    },
    summaryRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 16 },
    summaryCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: "center", gap: 4 },
    summaryAmount: { fontSize: 16, fontWeight: "800" as const, color: "#FFFFFF" },
    summaryLabel: { fontSize: 11, color: "rgba(255,255,255,0.75)" },
    perfCard: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700" as const,
      color: colors.text,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    perfRow: { flexDirection: "row", alignItems: "center" },
    perfItem: { flex: 1, alignItems: "center", gap: 4 },
    perfDivider: { width: 1, height: 40, backgroundColor: colors.border },
    perfValue: { fontSize: 18, fontWeight: "700" as const, color: colors.text },
    perfLabel: { fontSize: 11, color: colors.mutedForeground },
    emptyBox: { alignItems: "center", paddingVertical: 40, gap: 10 },
    emptyText: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", paddingHorizontal: 32 },
    tripCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginBottom: 10,
      borderRadius: 14,
      padding: 14,
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    tripIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    tripAddress: { fontSize: 13, fontWeight: "600" as const, color: colors.text },
    tripTime: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
    tripRight: { alignItems: "flex-end", gap: 4 },
    tripAmount: { fontSize: 16, fontWeight: "700" as const, color: colors.text },
    paidBadge: {
      backgroundColor: `${colors.success}20`,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    pendingBadge: { backgroundColor: `${colors.warning}20` },
    paidText: { fontSize: 11, color: colors.success, fontWeight: "600" as const },
    pendingText: { color: colors.warning },
  });
}
