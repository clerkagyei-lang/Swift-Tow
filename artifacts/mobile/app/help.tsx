import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const SUPPORT_PHONE = "+233302000000";
const WHATSAPP_NUM = "233302000000";

export default function HelpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = makeStyles(colors);

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS !== "web") Linking.openURL(`tel:${SUPPORT_PHONE}`);
  };

  const handleWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`https://wa.me/${WHATSAPP_NUM}?text=Hello%20Swift%20Tow%20Support`);
  };

  const faqs = [
    { q: "How long does it take for a tow truck?", a: "Our drivers typically arrive in 5–15 minutes depending on your location in Accra." },
    { q: "What payment methods do you accept?", a: "We accept MTN MoMo, Telecel Cash, AT Money, and Cash." },
    { q: "Can I cancel a tow request?", a: "Yes, you can cancel before a driver accepts your request without any charge." },
    { q: "What areas do you cover?", a: "We currently serve Accra and Mampong regions. Coverage is expanding." },
    { q: "How is the price calculated?", a: "Prices are based on tow type and distance. You'll see an estimated range before confirming." },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="headset" size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>We're here to help</Text>
          <Text style={styles.heroSub}>Our support team is available 24/7 for emergencies</Text>
        </View>

        {/* Contact buttons */}
        <View style={styles.contactRow}>
          <Pressable
            style={({ pressed }) => [styles.contactBtn, styles.callContactBtn, pressed && { opacity: 0.85 }]}
            onPress={handleCall}
          >
            <View style={styles.contactIconCircle}>
              <Ionicons name="call" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.contactBtnLabel}>Call Support</Text>
            <Text style={styles.contactBtnSub}>{SUPPORT_PHONE}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.contactBtn, styles.whatsappBtn, pressed && { opacity: 0.85 }]}
            onPress={handleWhatsApp}
          >
            <View style={[styles.contactIconCircle, { backgroundColor: "#25D366" }]}>
              <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.contactBtnLabel}>WhatsApp</Text>
            <Text style={styles.contactBtnSub}>Chat with us</Text>
          </Pressable>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqCard}>
          {faqs.map((faq, i) => (
            <View key={i} style={[styles.faqItem, i < faqs.length - 1 && styles.faqBorder]}>
              <View style={styles.faqQ}>
                <View style={styles.faqDot} />
                <Text style={styles.faqQuestion}>{faq.q}</Text>
              </View>
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 18, fontWeight: "700" as const, color: colors.text },
    hero: { alignItems: "center", padding: 32, backgroundColor: colors.secondary, marginBottom: 24 },
    heroIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    heroTitle: { fontSize: 22, fontWeight: "700" as const, color: "#FFFFFF", marginBottom: 8 },
    heroSub: { fontSize: 14, color: "rgba(255,255,255,0.7)", textAlign: "center" },
    contactRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginBottom: 24 },
    contactBtn: { flex: 1, borderRadius: 16, padding: 16, alignItems: "center", gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
    callContactBtn: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary },
    whatsappBtn: { backgroundColor: colors.card, borderWidth: 1, borderColor: "#25D366" },
    contactIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    contactBtnLabel: { fontSize: 14, fontWeight: "700" as const, color: colors.text },
    contactBtnSub: { fontSize: 12, color: colors.mutedForeground },
    sectionTitle: { fontSize: 16, fontWeight: "700" as const, color: colors.text, paddingHorizontal: 16, marginBottom: 12 },
    faqCard: { backgroundColor: colors.card, marginHorizontal: 16, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, overflow: "hidden" },
    faqItem: { padding: 16 },
    faqBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    faqQ: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
    faqDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 6 },
    faqQuestion: { fontSize: 14, fontWeight: "600" as const, color: colors.text, flex: 1 },
    faqAnswer: { fontSize: 13, color: colors.mutedForeground, lineHeight: 20, paddingLeft: 14 },
  });
}
