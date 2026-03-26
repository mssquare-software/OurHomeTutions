import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type BadgeDef = {
  id: string;
  title: string;
  emoji: string;
  category: string;
  target: number;
};

/** A–E rules: Trust drives conversion; Reliability = platform trust; Performance = pick mentors; Expertise = tags; Milestones = secondary */
const BADGES: BadgeDef[] = [
  // A. Trust — most important for bookings
  { id: "t1", title: "Verified Mentor (KYC / manual)", emoji: "✔️", category: "A. Trust", target: 100 },
  { id: "t2", title: "Top Rated (4.7+ reviews)", emoji: "⭐", category: "A. Trust", target: 85 },
  { id: "t3", title: "Top 10% Mentor", emoji: "🏆", category: "A. Trust", target: 70 },
  // B. Reliability
  { id: "r1", title: "On-Time Mentor (95% punctual)", emoji: "🟢", category: "B. Reliability", target: 95 },
  { id: "r2", title: "Zero Cancellation (30 sessions)", emoji: "❌", category: "B. Reliability", target: 80 },
  { id: "r3", title: "Consistent Mentor (weekly)", emoji: "📅", category: "B. Reliability", target: 75 },
  // C. Performance
  { id: "p1", title: "High Demand (often fully booked)", emoji: "🔥", category: "C. Performance", target: 60 },
  { id: "p2", title: "Repeat Favorite (rebooks)", emoji: "🔁", category: "C. Performance", target: 55 },
  { id: "p3", title: "Fast Growing (activity spike)", emoji: "📈", category: "C. Performance", target: 50 },
  // D. Expertise — tag-based search
  { id: "e1", title: "Subject / Domain Expert", emoji: "🧠", category: "D. Expertise", target: 88 },
  { id: "e2", title: "System Design Mentor", emoji: "💻", category: "D. Expertise", target: 72 },
  { id: "e3", title: "Startup Advisor", emoji: "🚀", category: "D. Expertise", target: 65 },
  // E. Milestones — minimal, secondary
  { id: "m1", title: "10 sessions → Starter", emoji: "10", category: "E. Milestone", target: 35 },
  { id: "m2", title: "50 sessions → Active", emoji: "50", category: "E. Milestone", target: 25 },
  { id: "m3", title: "100 sessions → Pro", emoji: "100", category: "E. Milestone", target: 15 },
];

function Confetti({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const parts = Array.from({ length: 28 }).map((_, i) => ({
    key: i,
    left: `${(i * 37) % 100}%`,
    emoji: ["🎉", "✨", "⭐", "🎊"][i % 4],
  }));
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.confettiWrap} onPress={onClose}>
        {parts.map((p) => (
          <Text key={p.key} style={[styles.confettiPiece, { left: p.left as any }]}>
            {p.emoji}
          </Text>
        ))}
        <Text style={styles.confettiTitle}>Badge unlocked!</Text>
      </Pressable>
    </Modal>
  );
}

function BadgeRow({
  b,
  onComplete,
}: {
  b: BadgeDef;
  onComplete?: () => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const sub = progress.addListener(({ value }) => setPct(Math.round(value * 100)));
    Animated.timing(progress, {
      toValue: b.target / 100,
      duration: 1400,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && b.target >= 100 && onComplete) onComplete();
    });
    return () => progress.removeListener(sub);
  }, [b.target, progress, onComplete]);

  return (
    <View style={styles.badgeCard}>
      <Text style={styles.badgeEmoji}>
        {b.emoji} {b.title}
      </Text>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.pctText}>{pct}%</Text>
    </View>
  );
}

export default function MentorBadgesScreen() {
  const [party, setParty] = useState(false);
  const unlocked = useRef(false);

  const celebrate = () => {
    if (unlocked.current) return;
    unlocked.current = true;
    setParty(true);
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#FFE8F0", "#FFF5EB", "#E8F4FF"]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Feather name="arrow-left" size={22} color="#1A1D1F" />
          </Pressable>
          <Text style={styles.title}>Badges</Text>
          <Pressable onPress={() => router.push("/language" as any)} style={styles.iconBtn}>
            <Feather name="globe" size={20} color="#1A1D1F" />
          </Pressable>
        </View>
        <Text style={styles.intro}>
          A Trust (Verified, Top Rated, Top 10%) boosts conversion. B Reliability (on-time, no
          cancels, consistent) builds platform trust. C Performance (demand, repeats, growth)
          helps parents choose. D Expertise tags improve search. E Milestones are secondary.
          Bars animate on open; at 100% a badge activates with celebration (tap to close).
        </Text>
        <ScrollView contentContainerStyle={styles.scroll}>
          {BADGES.map((b, i) => (
            <View key={b.id}>
              <Text style={styles.cat}>{b.category}</Text>
              <BadgeRow b={b} onComplete={i === 0 ? celebrate : undefined} />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
      <Confetti visible={party} onClose={() => setParty(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "800", color: "#1A1D1F" },
  intro: { paddingHorizontal: 16, color: "#6B7280", marginBottom: 8, fontSize: 13 },
  scroll: { padding: 16, paddingBottom: 48 },
  cat: { fontSize: 12, fontWeight: "900", color: "#8F54FF", marginBottom: 6, marginTop: 8 },
  badgeCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3E8FF",
  },
  badgeEmoji: { fontWeight: "800", color: "#1F2937", marginBottom: 8 },
  track: {
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: "#8F54FF",
    borderRadius: 6,
  },
  pctText: { marginTop: 4, fontSize: 12, fontWeight: "800", color: "#6B7280" },
  confettiWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  confettiPiece: {
    position: "absolute",
    top: "20%",
    fontSize: 28,
  },
  confettiTitle: {
    marginTop: 120,
    fontSize: 22,
    fontWeight: "900",
    color: "#FFF",
  },
});
