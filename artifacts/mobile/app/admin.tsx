import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface PendingDriver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehiclePlate: string;
  licenseNumber: string;
  approvalStatus: "pending" | "approved" | "suspended";
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  approved: "#10B981",
  suspended: "#EF4444",
};

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<PendingDriver[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "suspended" | "all">("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "localhost";

  const fetchDrivers = useCallback(async () => {
    try {
      const statusParam = filter === "all" ? "" : `?status=${filter}&userId=${user?.id}`;
      const res = await fetch(`https://${domain}/api/admin/drivers${statusParam || `?userId=${user?.id}`}`);
      if (res.ok) {
        const data = await res.json();
        setDrivers(data);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [filter, user?.id]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const handleAction = async (driverId: string, action: "approve" | "reject") => {
    setActionLoading(driverId + action);
    try {
      const res = await fetch(`https://${domain}/api/admin/drivers/${driverId}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (res.ok) { await fetchDrivers(); }
    } finally {
      setActionLoading(null);
    }
  };

  const styles = makeStyles(colors);
  const filteredDrivers = filter === "all" ? drivers : drivers.filter(d => d.approvalStatus === filter);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSub}>Driver Applications</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {(["pending", "approved", "suspended", "all"] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => { setFilter(f); setIsLoading(true); }}
          >
            <Text style={[styles.filterChipText, filter === f && { color: colors.primary, fontWeight: "700" as const }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDrivers(); }} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : filteredDrivers.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="truck-check" size={48} color={colors.border} />
            <Text style={styles.emptyText}>No {filter === "all" ? "" : filter} drivers</Text>
          </View>
        ) : (
          filteredDrivers.map((driver) => (
            <View key={driver.id} style={styles.driverCard}>
              <View style={styles.driverHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{driver.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.driverName}>{driver.name}</Text>
                  <Text style={styles.driverEmail}>{driver.email}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[driver.approvalStatus]}20` }]}>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[driver.approvalStatus] }]} />
                  <Text style={[styles.statusText, { color: STATUS_COLORS[driver.approvalStatus] }]}>
                    {driver.approvalStatus}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsGrid}>
                {[
                  { icon: "call-outline" as const, label: driver.phone },
                  { icon: "car-outline" as const, label: driver.vehicleType },
                  { icon: "card-outline" as const, label: driver.vehiclePlate },
                  { icon: "id-card-outline" as const, label: driver.licenseNumber },
                ].map((item, i) => (
                  <View key={i} style={styles.detailRow}>
                    <Ionicons name={item.icon} size={14} color={colors.mutedForeground} />
                    <Text style={styles.detailText}>{item.label}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.appliedDate}>
                Applied {new Date(driver.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}
              </Text>

              {driver.approvalStatus === "pending" && (
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.rejectBtn, actionLoading === driver.id + "reject" && { opacity: 0.6 }]}
                    onPress={() => handleAction(driver.id, "reject")}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === driver.id + "reject"
                      ? <ActivityIndicator size="small" color="#EF4444" />
                      : <><Ionicons name="close" size={16} color="#EF4444" /><Text style={styles.rejectBtnText}>Reject</Text></>}
                  </Pressable>
                  <Pressable
                    style={[styles.approveBtn, actionLoading === driver.id + "approve" && { opacity: 0.6 }]}
                    onPress={() => handleAction(driver.id, "approve")}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === driver.id + "approve"
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <><Ionicons name="checkmark" size={16} color="#fff" /><Text style={styles.approveBtnText}>Approve</Text></>}
                  </Pressable>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 22, fontWeight: "800" as const, color: colors.text },
    headerSub: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
    adminBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: `${colors.primary}15`, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    adminBadgeText: { fontSize: 12, fontWeight: "700" as const, color: colors.primary },
    filterRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border },
    filterChipActive: { backgroundColor: `${colors.primary}15`, borderColor: colors.primary },
    filterChipText: { fontSize: 13, color: colors.mutedForeground },
    list: { flex: 1 },
    empty: { alignItems: "center", paddingTop: 60, gap: 12 },
    emptyText: { fontSize: 16, color: colors.mutedForeground },
    driverCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    driverHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    avatarText: { fontSize: 18, fontWeight: "700" as const, color: "#fff" },
    driverName: { fontSize: 15, fontWeight: "700" as const, color: colors.text },
    driverEmail: { fontSize: 12, color: colors.mutedForeground, marginTop: 1 },
    statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: "700" as const, textTransform: "capitalize" },
    detailsGrid: { gap: 6, marginBottom: 10 },
    detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    detailText: { fontSize: 13, color: colors.text },
    appliedDate: { fontSize: 11, color: colors.mutedForeground, marginBottom: 12 },
    actions: { flexDirection: "row", gap: 10 },
    rejectBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: "#EF4444", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
    rejectBtnText: { fontSize: 14, fontWeight: "600" as const, color: "#EF4444" },
    approveBtn: { flex: 2, height: 44, borderRadius: 10, backgroundColor: "#10B981", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
    approveBtnText: { fontSize: 14, fontWeight: "700" as const, color: "#fff" },
  });
}
