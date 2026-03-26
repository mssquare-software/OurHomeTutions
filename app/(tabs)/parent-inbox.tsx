import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import StarRating from "react-native-star-rating-widget";
import { useUser } from "../context/UserContext";
import { useNotifications } from "../hooks/useNotifications";

export default function ParentInboxScreen() {
  const { email } = useUser();
  const { notifications, markAsRead, getBookingsForParent, rateBooking, bookings } =
    useNotifications();
  const [tick, setTick] = useState(0);
  const [ratingDraft, setRatingDraft] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      setTick((t) => t + 1);
    }, [])
  );

  const mine = useMemo(() => {
    if (!email) return [];
    return notifications.filter(
      (n) =>
        n.userId.toLowerCase() === email.toLowerCase() && n.role === "parent"
    );
  }, [notifications, email, tick]);

  const rateable = useMemo(() => {
    if (!email) return [];
    return getBookingsForParent(email).filter(
      (b) => b.status === "completed" && b.parentRating == null
    );
  }, [email, getBookingsForParent, bookings, tick]);

  const onRate = async (bookingId: string, stars: number) => {
    await rateBooking(bookingId, stars);
    Alert.alert("Thanks!", "Your rating was saved.");
    setTick((t) => t + 1);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Feather name="chevron-left" size={24} color="#0F172A" />
        </Pressable>
        <Text style={styles.title}>Inbox</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {rateable.length > 0 ? (
          <View style={styles.rateSection}>
            <Text style={styles.rateSectionTitle}>Rate your mentor</Text>
            {rateable.map((b) => (
              <View key={b.id} style={styles.rateCard}>
                <Text style={styles.rateCardTitle}>
                  {b.mentorName ?? "Mentor"} • {b.subject}
                </Text>
                <StarRating
                  rating={ratingDraft[b.id] ?? 0}
                  onChange={(s) =>
                    setRatingDraft((d) => ({ ...d, [b.id]: s }))
                  }
                  starSize={32}
                  color="#FBBF24"
                  emptyColor="#E2E8F0"
                />
                <Pressable
                  style={[
                    styles.submitRate,
                    (ratingDraft[b.id] ?? 0) < 1 && styles.submitRateDisabled,
                  ]}
                  disabled={(ratingDraft[b.id] ?? 0) < 1}
                  onPress={() => {
                    const s = ratingDraft[b.id];
                    if (s >= 1) onRate(b.id, s);
                  }}
                >
                  <Text style={styles.submitRateText}>Submit rating</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {mine.length === 0 && rateable.length === 0 ? (
          <Text style={styles.empty}>No messages yet.</Text>
        ) : mine.length === 0 ? (
          <Text style={styles.empty}>You’re all caught up on messages.</Text>
        ) : (
          mine.map((n) => (
            <Pressable
              key={n.id}
              style={[styles.row, !n.read && styles.rowUnread]}
              onPress={() => markAsRead(n.id)}
            >
              <Text style={styles.rowTitle}>{n.title}</Text>
              <Text style={styles.rowDesc}>{n.description}</Text>
              <Text style={styles.rowTime}>
                {new Date(n.createdAt).toLocaleString()}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  scroll: { padding: 16, paddingBottom: 40 },
  empty: { textAlign: "center", color: "#94A3B8", marginTop: 40 },
  row: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rowUnread: { borderColor: "#7F3DFF", borderWidth: 2 },
  rowTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  rowDesc: { marginTop: 6, color: "#64748B", lineHeight: 20 },
  rowTime: { marginTop: 8, fontSize: 11, color: "#94A3B8" },
  rateSection: { marginBottom: 20 },
  rateSectionTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A", marginBottom: 12 },
  rateCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#7F3DFF",
  },
  rateCardTitle: { fontWeight: "800", marginBottom: 12, color: "#334155" },
  submitRate: {
    marginTop: 14,
    backgroundColor: "#7F3DFF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  submitRateDisabled: { opacity: 0.45 },
  submitRateText: { color: "#FFF", fontWeight: "800" },
});
