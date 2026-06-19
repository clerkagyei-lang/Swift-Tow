import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTow } from "@/context/TowContext";
import { useColors } from "@/hooks/useColors";

const STEPS = [
  { icon: "radio-button-on" as const, text: "Request sent to nearby drivers" },
  { icon: "time-outline" as const, text: "Waiting for a driver to accept" },
  { icon: "navigate-outline" as const, text: "Driver will head to your location" },
];

export default function SearchingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { towStatus, cancelRequest } = useTow();

  const pulse = useRef(new Animated.Value(1)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (towStatus === "accepted" || towStatus === "in_progress") {
      router.replace("/active-request");
    } else if (towStatus === "idle") {
      router.back();
    }
  }, [towStatus]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const animateRing = (ring: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(ring, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(ring, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    };
    animateRing(ring1, 0);
    animateRing(ring2, 600);
    animateRing(ring3, 1200);
  }, []);

  useEffect(() => {
    const bounceDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      ).start();
    };
    bounceDot(dot1, 0);
    bounceDot(dot2, 300);
    bounceDot(dot3, 600);
  }, []);

  const handleCancel = async () => {
    await cancelRequest();
  };

  const styles = makeStyles(colors);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 24),
          paddingBottom: insets.bottom + 32,
        },
      ]}
    >
      <View style={styles.ringContainer}>
        {[ring1, ring2, ring3].map((ring, i) => (
          <Animated.View
            key={i}
            style={[
              styles.ring,
              {
                opacity: ring.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.45, 0.15, 0] }),
                transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 3.6] }) }],
              },
            ]}
          />
        ))}
        <Animated.View style={[styles.iconCircle, { transform: [{ scale: pulse }] }]}>
          <MaterialCommunityIcons name="truck-fast" size={52} color="#FFFFFF" />
        </Animated.View>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>Searching for a Driver</Text>
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
          ))}
        </View>
      </View>

      <Text style={styles.subtitle}>
        Looking for available drivers near you. This usually takes under a minute.
      </Text>

      <View style={styles.stepsCard}>
        {STEPS.map((step, i) => (
          <View key={i} style={[styles.stepRow, i < STEPS.length - 1 && styles.stepRowBorder]}>
            <View style={[styles.stepIcon, i === 0 && styles.stepIconActive]}>
              <Ionicons
                name={step.icon}
                size={16}
                color={i === 0 ? "#FFFFFF" : colors.mutedForeground}
              />
            </View>
            <Text style={[styles.stepText, i === 0 && styles.stepTextActive]}>
              {step.text}
            </Text>
            {i === 0 && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={18} color={colors.mutedForeground} />
        <Text style={styles.infoText}>
          You'll be notified immediately when a driver accepts your request.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
        onPress={handleCancel}
      >
        <Ionicons name="close-circle-outline" size={18} color={colors.destructive} />
        <Text style={styles.cancelText}>Cancel Request</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    ringContainer: {
      width: 160,
      height: 160,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 36,
    },
    ring: {
      position: "absolute",
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    iconCircle: {
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 20,
      elevation: 12,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
    title: {
      fontSize: 24,
      fontWeight: "800" as const,
      color: colors.text,
    },
    dotsRow: {
      flexDirection: "row",
      gap: 4,
      alignItems: "center",
      paddingTop: 4,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    subtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: "center",
      lineHeight: 21,
      marginBottom: 28,
      paddingHorizontal: 8,
    },
    stepsCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      width: "100%",
      marginBottom: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
      overflow: "hidden",
    },
    stepRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    stepRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    stepIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    stepIconActive: {
      backgroundColor: colors.primary,
    },
    stepText: {
      flex: 1,
      fontSize: 13,
      color: colors.mutedForeground,
      lineHeight: 18,
    },
    stepTextActive: {
      color: colors.text,
      fontWeight: "600" as const,
    },
    liveBadge: {
      backgroundColor: colors.primary,
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    liveText: {
      fontSize: 9,
      fontWeight: "800" as const,
      color: "#FFFFFF",
      letterSpacing: 0.5,
    },
    infoCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: colors.muted,
      borderRadius: 12,
      padding: 14,
      width: "100%",
      marginBottom: 28,
    },
    infoText: {
      flex: 1,
      fontSize: 12,
      color: colors.mutedForeground,
      lineHeight: 18,
    },
    cancelBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1.5,
      borderColor: colors.destructive,
      borderRadius: 14,
      paddingHorizontal: 32,
      paddingVertical: 14,
    },
    cancelText: {
      color: colors.destructive,
      fontWeight: "700" as const,
      fontSize: 15,
    },
  });
}
