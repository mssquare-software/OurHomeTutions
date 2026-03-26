import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { BookingFlowStatus } from "../../constants/notificationTypes";
import type { AppUser, Booking } from "../data/models";
import { listBookings, listUsers } from "../data/repo/repo";
import { useNotifications } from "../hooks/useNotifications";

function formatMoney(n: number) {
  return `₹ ${n.toLocaleString("en-IN")}`;
}

function flowStatusColor(s: BookingFlowStatus) {
  if (s === "pending") return "#F59E0B";
  if (s === "assigned") return "#0EA5E9";
  if (s === "accepted" || s === "confirmed" || s === "in_progress") return "#22C55E";
  if (s === "completed") return "#3F8CFF";
  if (s === "rejected") return "#EF4444";
  return "#94A3B8";
}

function statusDotColor(status: Booking["status"]) {
  if (status === "active") return "#22C55E";
  if (status === "pending") return "#F59E0B";
  if (status === "completed") return "#3F8CFF";
  return "#FF6A55";
}

export default function AdminBookings() {
  const { bookings: liveBookings, assignTeacher } = useNotifications();
  const [repoBookings, setRepoBookings] = useState<Booking[]>([]);
  const [mentors, setMentors] = useState<AppUser[]>([]);
  const [pickBookingId, setPickBookingId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refreshRepo = async () => {
    const data = await listBookings();
    setRepoBookings(data);
  };

  useFocusEffect(
    useCallback(() => {
      refreshRepo();
      (async () => {
        const u = await listUsers();
        setMentors(u.filter((x) => x.role === "mentor"));
      })();
      setTick((t) => t + 1);
    }, [])
  );

  const sortedLive = useMemo(() => {
    return [...liveBookings].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [liveBookings, tick]);

  const sortedRepo = useMemo(() => {
    return [...repoBookings].sort((a, b) => b.createdAt - a.createdAt);
  }, [repoBookings]);

  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const liveToday = sortedLive.filter((b) => b.date === today).length;
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const repoToday = repoBookings.filter((b) => b.createdAt >= start.getTime()).length;

    const total = sortedLive.length + repoBookings.length;
    const todayCount = liveToday + repoToday;

    const revenueLive = sortedLive.reduce(
      (acc, b) => acc + (b.status === "completed" ? b.price ?? 0 : 0),
      0
    );
    const totalRevenue =
      revenueLive +
      repoBookings.reduce(
        (acc, b) =>
          acc + (b.status === "completed" ? 799 : b.status === "active" ? 499 : 0),
        0
      );

    const avgHours =
      sortedLive.length > 0
        ? sortedLive.reduce((a, b) => a + b.hours, 0) / sortedLive.length
        : repoBookings.length > 0
          ? repoBookings.reduce((a, b) => a + (b.mode === "online" ? 1.8 : 2.3), 0) /
            repoBookings.length
          : 0;

    return { total, todayCount, totalRevenue, avgSession: avgHours };
  }, [sortedLive, repoBookings]);

  const pickBooking = pickBookingId
    ? liveBookings.find((b) => b.id === pickBookingId)
    : undefined;
  const pickSlotKey = pickBooking
    ? pickBooking.slotKey ?? `${pickBooking.date}|${pickBooking.time}`
    : "";

  const mentorSlotBusy = (m: AppUser) => {
    if (!pickSlotKey || !pickBookingId) return false;
    return liveBookings.some(
      (b) =>
        b.id !== pickBookingId &&
        (b.slotKey ?? `${b.date}|${b.time}`) === pickSlotKey &&
        b.assignedTeacherId?.toLowerCase() === m.email.toLowerCase() &&
        ["assigned", "accepted", "in_progress", "confirmed"].includes(b.status)
    );
  };

  const onAssignMentor = async (mentor: AppUser) => {
    if (!pickBookingId) return;
    const res = await assignTeacher(pickBookingId, mentor.email, mentor.fullName);
    if (!res.ok) {
      Alert.alert("Cannot assign", res.error ?? "Try another mentor.");
      return;
    }
    Alert.alert("Assigned", `${mentor.fullName} was assigned for this booking.`);
    setPickBookingId(null);
    setTick((t) => t + 1);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1A1D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bookings</Text>
        <TouchableOpacity onPress={refreshRepo}>
          <Feather name="refresh-cw" size={20} color="#1A1D1F" />
        </TouchableOpacity>
      </View>

      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: "#3F8CFF" }]}>
          <View style={styles.metricTop}>
            <Text style={styles.metricLabel}>Total Revenue</Text>
            <Feather name="trending-up" size={14} color="#FFF" />
          </View>
          <Text style={styles.metricValue}>{formatMoney(metrics.totalRevenue)}</Text>
          <Text style={styles.metricSub}>All time</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: "#1A1D1F" }]}>
          <View style={styles.metricTop}>
            <Text style={styles.metricLabel}>Today</Text>
            <Feather name="calendar" size={14} color="#FFF" />
          </View>
          <Text style={styles.metricValue}>{metrics.todayCount}</Text>
          <Text style={styles.metricSub}>New bookings</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: "#8E59FF" }]}>
          <View style={styles.metricTop}>
            <Text style={styles.metricLabel}>Avg Session</Text>
            <Feather name="clock" size={14} color="#FFF" />
          </View>
          <Text style={styles.metricValue}>{metrics.avgSession.toFixed(1)} hrs</Text>
          <Text style={styles.metricSub}>Live + records</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: "#FF6A55" }]}>
          <View style={styles.metricTop}>
            <Text style={styles.metricLabel}>Total</Text>
            <Feather name="layers" size={14} color="#FFF" />
          </View>
          <Text style={styles.metricValue}>{metrics.total}</Text>
          <Text style={styles.metricSub}>Bookings</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Parent bookings (assign here)</Text>
        {sortedLive.length === 0 ? (
          <Text style={styles.emptyHint}>
            No live bookings yet. Parents book from the app — they appear here for assignment.
          </Text>
        ) : (
          sortedLive.map((b) => (
            <View key={b.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.dot, { backgroundColor: flowStatusColor(b.status) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{b.subject}</Text>
                  <Text style={styles.cardSub}>
                    {b.parentName} • {b.parentId}
                  </Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>{b.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Mode</Text>
                  <Text style={styles.detailValue}>{b.mode.toUpperCase()}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Mentor</Text>
                  <Text style={styles.detailValue}>{b.mentorName ?? "—"}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Slot</Text>
                  <Text style={styles.detailValue}>
                    {b.date} {b.time}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Hours / Price</Text>
                  <Text style={styles.detailValue}>
                    {b.hours}h • {formatMoney(b.price ?? 0)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={[styles.detailItem, { flex: 1 }]}>
                  <Text style={styles.detailLabel}>Contact / Address</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {b.contact} • {b.address ?? "—"}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                {b.status === "pending" ? (
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => setPickBookingId(b.id)}
                  >
                    <Feather name="user-check" size={16} color="#FFF" />
                    <Text style={styles.primaryBtnText}>Assign mentor</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.assignedNote}>
                    <Text style={styles.assignedNoteText}>
                      {b.status === "assigned"
                        ? "Waiting for mentor to accept…"
                        : "Assignment in progress or completed."}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => router.push("/(admin)/dashboard" as any)}
                >
                  <Feather name="grid" size={16} color="#1A1D1F" />
                  <Text style={styles.secondaryBtnText}>Dashboard</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {sortedRepo.length > 0 ? (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Demo / saved records</Text>
            {sortedRepo.map((b) => (
              <View key={`repo-${b.id}`} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.dot, { backgroundColor: statusDotColor(b.status) }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      {b.subject}
                      {b.topic ? ` • ${b.topic}` : ""}
                    </Text>
                    <Text style={styles.cardSub}>
                      {b.parentName} • {b.parentEmail}
                    </Text>
                  </View>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{b.status.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Mode</Text>
                    <Text style={styles.detailValue}>{b.mode.toUpperCase()}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Mentor</Text>
                    <Text style={styles.detailValue}>{b.mentorName ?? "Not assigned"}</Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => router.push("/(admin)/booking-management" as any)}
                  >
                    <Feather name="user-check" size={16} color="#FFF" />
                    <Text style={styles.primaryBtnText}>Assign in management</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>

      <Modal visible={!!pickBookingId} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Assign mentor</Text>
            {pickBooking ? (
              <Text style={styles.modalSub}>
                {pickBooking.parentName} • {pickBooking.subject} • {pickBooking.date}{" "}
                {pickBooking.time}
              </Text>
            ) : null}
            <ScrollView style={{ maxHeight: 360 }}>
              {mentors.length === 0 ? (
                <Text style={styles.emptyHint}>No mentors in users list. Register a mentor first.</Text>
              ) : (
                mentors.map((m) => {
                  const busy = mentorSlotBusy(m);
                  return (
                    <Pressable
                      key={m.id}
                      style={[styles.mentorRow, busy && styles.mentorRowDisabled]}
                      onPress={() => {
                        if (busy) {
                          Alert.alert("Busy", "This mentor is already booked for this slot.");
                          return;
                        }
                        onAssignMentor(m);
                      }}
                    >
                      <Text style={styles.mentorName}>{m.fullName}</Text>
                      <Text style={styles.mentorEmail}>{m.email}</Text>
                      {busy ? <Text style={styles.busyTag}>Busy</Text> : null}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
            <Pressable style={styles.cancelModal} onPress={() => setPickBookingId(null)}>
              <Text style={{ fontWeight: "700" }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F4F4" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1A1D1F" },

  metricsGrid: {
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    width: "48%",
    borderRadius: 18,
    padding: 14,
  },
  metricTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metricLabel: { color: "#FFF", fontWeight: "800" },
  metricValue: { color: "#FFF", fontWeight: "900", fontSize: 18, marginTop: 10 },
  metricSub: { color: "rgba(255,255,255,0.85)", marginTop: 4, fontWeight: "700" },

  sectionLabel: {
    paddingHorizontal: 4,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
  },
  emptyHint: {
    color: "#6F767E",
    fontWeight: "600",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },

  scroll: { padding: 16, paddingBottom: 30, gap: 12 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 10 },
  cardTitle: { fontWeight: "900", color: "#1A1D1F" },
  cardSub: { color: "#6F767E", marginTop: 2, fontSize: 12 },
  statusPill: { backgroundColor: "#F4F4F4", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontWeight: "900", color: "#1A1D1F", fontSize: 12 },
  detailRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  detailItem: { flex: 1, backgroundColor: "#0B1220", borderRadius: 14, padding: 12 },
  detailLabel: { color: "#9AA0A6", fontWeight: "700", fontSize: 12 },
  detailValue: { color: "#FFFFFF", fontWeight: "800", marginTop: 4 },
  cardActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  assignedNote: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  assignedNoteText: { color: "#6F767E", fontWeight: "700", fontSize: 12 },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3F8CFF",
    borderRadius: 16,
    paddingVertical: 12,
  },
  primaryBtnText: { color: "#FFF", fontWeight: "900" },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F4F4",
    borderRadius: 16,
    paddingVertical: 12,
  },
  secondaryBtnText: { color: "#1A1D1F", fontWeight: "900" },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "75%",
  },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalSub: { marginTop: 8, color: "#64748B", fontWeight: "600" },
  mentorRow: { paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F1F5F9" },
  mentorRowDisabled: { opacity: 0.55 },
  mentorName: { fontWeight: "800", color: "#1A1D1F" },
  mentorEmail: { color: "#64748B", fontSize: 12, marginTop: 2 },
  busyTag: { marginTop: 4, fontSize: 12, fontWeight: "800", color: "#B45309" },
  cancelModal: { padding: 16, alignItems: "center" },
});
