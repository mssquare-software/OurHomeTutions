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
  View,
} from "react-native";
import { ADMIN_USER_ID } from "../../constants/notificationTypes";
import type { AppUser } from "../data/models";
import { listUsers } from "../data/repo/repo";
import { useNotifications } from "../hooks/useNotifications";

export default function AdminBookingInboxScreen() {
  const {
    notifications,
    bookings,
    assignTeacher,
    markAsRead,
  } = useNotifications();
  const [mentors, setMentors] = useState<AppUser[]>([]);
  const [pickBookingId, setPickBookingId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const u = await listUsers();
        setMentors(u.filter((x) => x.role === "mentor"));
      })();
      setTick((t) => t + 1);
    }, [])
  );

  const adminNotes = useMemo(
    () =>
      notifications.filter(
        (n) => n.userId === ADMIN_USER_ID && n.role === "admin"
      ),
    [notifications, tick]
  );

  const pendingBookings = useMemo(
    () => bookings.filter((b) => b.status === "pending" || b.status === "assigned"),
    [bookings, tick]
  );

  const onAssign = async (mentor: AppUser) => {
    if (!pickBookingId) return;
    const res = await assignTeacher(pickBookingId, mentor.email, mentor.fullName);
    if (!res.ok) {
      Alert.alert("Cannot assign", res.error ?? "Try another mentor or time.");
      return;
    }
    Alert.alert("Assigned", `${mentor.fullName} will see this in their mentor inbox.`);
    setPickBookingId(null);
  };

  const pickBooking = pickBookingId
    ? bookings.find((b) => b.id === pickBookingId)
    : undefined;
  const pickSlotKey = pickBooking
    ? pickBooking.slotKey ?? `${pickBooking.date}|${pickBooking.time}`
    : "";

  const mentorSlotBusy = (m: AppUser) => {
    if (!pickSlotKey) return false;
    return bookings.some(
      (b) =>
        b.id !== pickBookingId &&
        (b.slotKey ?? `${b.date}|${b.time}`) === pickSlotKey &&
        b.assignedTeacherId?.toLowerCase() === m.email.toLowerCase() &&
        ["assigned", "accepted", "in_progress", "confirmed"].includes(b.status)
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1A1D1F" />
        </Pressable>
        <Text style={styles.title}>Booking inbox</Text>
        <View style={{ width: 22 }} />
      </View>

      <Text style={styles.section}>Notifications</Text>
      <ScrollView style={styles.list} contentContainerStyle={styles.scroll}>
        {adminNotes.map((n) => (
          <Pressable
            key={n.id}
            style={styles.card}
            onPress={() => markAsRead(n.id)}
          >
            <Text style={styles.cardTitle}>{n.title}</Text>
            <Text style={styles.cardBody}>{n.description}</Text>
          </Pressable>
        ))}

        <Text style={[styles.section, { marginTop: 20 }]}>Assign mentor</Text>
        {pendingBookings.map((b) => {
          return (
            <View key={b.id} style={styles.bookCard}>
              <Text style={styles.bookTitle}>
                {b.parentName} • {b.subject}
              </Text>
              <Text style={styles.bookLine}>📍 {b.address ?? "—"}</Text>
              <Text style={styles.bookLine}>📞 {b.contact}</Text>
              <Text style={styles.bookLine}>
                ⏱ {b.hours}h • {b.date} {b.time} • ₹{b.price ?? "—"}
              </Text>
              <Pressable
                style={styles.assignBtn}
                onPress={() => setPickBookingId(b.id)}
              >
                <Text style={styles.assignBtnText}>Assign mentor</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={!!pickBookingId} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pick mentor</Text>
            <ScrollView>
              {mentors.map((m) => {
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
                      onAssign(m);
                    }}
                  >
                    <Text style={styles.mentorName}>{m.fullName}</Text>
                    <Text style={styles.mentorEmail}>{m.email}</Text>
                    {busy ? (
                      <Text style={styles.busyTag}>Busy</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              style={styles.cancelModal}
              onPress={() => setPickBookingId(null)}
            >
              <Text>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F6F8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  title: { fontSize: 18, fontWeight: "800" },
  section: { paddingHorizontal: 16, fontWeight: "800", color: "#64748B" },
  list: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  cardTitle: { fontWeight: "800" },
  cardBody: { marginTop: 4, color: "#64748B" },
  bookCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  bookTitle: { fontSize: 16, fontWeight: "800" },
  bookLine: { marginTop: 4, color: "#475569" },
  busy: { marginTop: 8, color: "#B45309", fontWeight: "700" },
  assignBtn: {
    marginTop: 12,
    backgroundColor: "#3F8CFF",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  assignBtnText: { color: "#FFF", fontWeight: "800" },
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
    maxHeight: "70%",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 12 },
  mentorRow: { paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F1F5F9" },
  mentorRowDisabled: { opacity: 0.55 },
  busyTag: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: "#B45309",
  },
  mentorName: { fontWeight: "800" },
  mentorEmail: { color: "#64748B", fontSize: 12 },
  cancelModal: { padding: 16, alignItems: "center" },
});
