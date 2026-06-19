import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
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

const TIMEOUT_SECONDS = 180;

const STEPS = [
  { icon: "radio-button-on" as const, text: "Request sent to nearby drivers" },
  { icon: "time-outline" as const, text: "Waiting for a driver to accept" },
  { icon: "navigate-outline" as const, text: "Driver will head to your location" },
];

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SearchingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { towStatus, cancelRequest } = useTow();

  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);
  const [timedOut, setTimedOut] = useState(false);

  const pulse = useRef(new Animated.Value(1)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (towStatus === "accepted" || towStatus === "in_progress") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/active-request");
    } else if (towStatus === "idle" && !timedOut) {
      router.back();
    }
  }, [towStatus]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: TIMEOUT_SECONDS * 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    if (timedOut) return;
    if (secondsLeft <= 0) {
      handleTimeout();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, timedOut]);

  async function handleTimeout() {
    setTimedOut(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    await cancelRequest();
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  }

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await cancelRequest();
    router.replace("/(tabs)/");
  };

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/(tabs)/");
  };

  const styles = makeStyles(colors);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 24);
  const botPad = insets.bottom + 32;

  if (timedOut) {
    return (
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <View style={styles.timeoutCircle}>
            <Ionicons name="time-outline" size={56} color="#FFFFFF" />
          </View>
        </Animated.View>

        <Text style={styles.timeoutTitle}>No Drivers Available</Text>
        <Text style={styles.timeoutSubtitle}>
          We couldn't find an available driver in your area right now. Please try again in a few minutes.
        </Text>

        <View style={styles.timeoutCard}>
          <View style={styles.timeoutRow}>
            <Ionicons name="location-outline" size={18} color={colors.mutedForeground} />
            <Text style={styles.timeoutHint}>Try moving to a busier area or wait a few minutes</Text>
          </View>
          <View style={styles.timeoutRow}>
            <Ionicons name="call-outline" size={18} color={colors.mutedForeground} />
            <Text style={styles.timeoutHint}>Call support if you need urgent assistance</Text>
          </View>
        </View>

        <View style={styles.timeoutActions}>
          <Pressable
            style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.88 }]}
            onPress={handleRetry}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.homeBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.replace("/(tabs)/")}
          >
            <Ionicons name="home-outline" size={18} color={colors.secondary} />
            <Text style={styles.homeText}>Go Home</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const urgentColor = secondsLeft <= 30 ? "#EF4444" : secondsLeft <= 60 ? "#F97316" : colors.primary;

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      <View style={styles.ringContainer}>
        {[ring1, ring2, ring3].map((ring, i) => (
          <Animated.View
            key={i}
            style={[
              styles.ring,
              {
                borderColor: urgentColor,
                opacity: ring.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.45, 0.15, 0] }),
                transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 3.6] }) }],
              },
            ]}
          />
        ))}
        <Animated.View style={[styles.iconCircle, { backgroundColor: urgentColor, transform: [{ scale: pulse }] }]}>
          <MaterialCommunityIcons name="truck-fast" size={52} color="#FFFFFF" />
        </Animated.View>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>Searching for a Driver</Text>
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: dot, backgroundColor: urgentColor }]} />
          ))}
        </View>
      </View>

      <Text style={styles.subtitle}>
        Looking for available drivers near you. This usually takes under a minute.
      </Text>

      <View style={styles.timerRow}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: urgentColor,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
        <View style={styles.progressTrack} />
        <Text style={[styles.timerText, { color: urgentColor }]}>
          {secondsLeft <= 60 && secondsLeft > 0 ? `Expires in ${formatTime(secondsLeft)}` : `${formatTime(secondsLeft)} remaining`}
        </Text>
      </View>

      <View style={styles.stepsCard}>
        {STEPS.map((step, i) => (
          <View key={i} style={[styles.stepRow, i < STEPS.length - 1 && styles.stepRowBorder]}>
            <View style={[styles.stepIcon, i === 0 && { backgroundColor: urgentColor }]}>
              <Ionicons name={step.icon} size={16} color={i === 0 ? "#FFFFFF" : colors.mutedForeground} />
            </View>
            <Text style={[styles.stepText, i === 0 && styles.stepTextActive]}>{step.text}</Text>
            {i === 0 && (
              <View style={[styles.liveBadge, { backgroundColor: urgentColor }]}>
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={18} color={colors.mutedForeground} />
        <Text style={styles.infoText}>
          You'll be notified immediately when a driver accepts your request. Request expires after {Math.floor(TIMEOUT_SECONDS / 60)} minutes.
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
      marginBottom: 30,
    },
    ring: {
      position: "absolute",
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 2,
    },
    iconCircle: {
      width: 110,
      height: 110,
      borderRadius: 55,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 12,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 8,
    },
    title: { fontSize: 22, fontWeight: "800" as const, color: colors.text },
    dotsRow: { flexDirection: "row", gap: 4, alignItems: "center", paddingTop: 4 },
    dot: { width: 7, height: 7, borderRadius: 4 },
    subtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    timerRow: {
      width: "100%",
      marginBottom: 20,
      gap: 6,
    },
    progressTrack: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.muted,
    },
    progressBar: {
      height: 5,
      borderRadius: 3,
      zIndex: 1,
    },
    timerText: {
      fontSize: 11,
      fontWeight: "600" as const,
      textAlign: "right",
    },
    stepsCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      width: "100%",
      marginBottom: 12,
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
      paddingVertical: 13,
    },
    stepRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    stepIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    stepText: { flex: 1, fontSize: 13, color: colors.mutedForeground, lineHeight: 18 },
    stepTextActive: { color: colors.text, fontWeight: "600" as const },
    liveBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    liveText: { fontSize: 9, fontWeight: "800" as const, color: "#FFFFFF", letterSpacing: 0.5 },
    infoCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: colors.muted,
      borderRadius: 12,
      padding: 12,
      width: "100%",
      marginBottom: 22,
    },
    infoText: { flex: 1, fontSize: 12, color: colors.mutedForeground, lineHeight: 17 },
    cancelBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1.5,
      borderColor: colors.destructive,
      borderRadius: 14,
      paddingHorizontal: 32,
      paddingVertical: 13,
    },
    cancelText: { color: colors.destructive, fontWeight: "700" as const, fontSize: 14 },

    timeoutCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "#EF4444",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 28,
      shadowColor: "#EF4444",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 10,
    },
    timeoutTitle: {
      fontSize: 24,
      fontWeight: "800" as const,
      color: colors.text,
      marginBottom: 10,
      textAlign: "center",
    },
    timeoutSubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: "center",
      lineHeight: 21,
      marginBottom: 24,
      paddingHorizontal: 8,
    },
    timeoutCard: {
      backgroundColor: colors.muted,
      borderRadius: 16,
      width: "100%",
      padding: 16,
      gap: 12,
      marginBottom: 28,
    },
    timeoutRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    timeoutHint: { flex: 1, fontSize: 13, color: colors.mutedForeground, lineHeight: 19 },
    timeoutActions: { width: "100%", gap: 10 },
    retryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 15,
    },
    retryText: { color: "#FFFFFF", fontWeight: "700" as const, fontSize: 15 },
    homeBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.muted,
      borderRadius: 14,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    homeText: { color: colors.secondary, fontWeight: "600" as const, fontSize: 15 },
  });
}
