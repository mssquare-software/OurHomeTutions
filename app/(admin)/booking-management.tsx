import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { AppUser, Booking } from "../data/models";
import { assignMentorToBooking, listBookings } from "../data/repo/repo";
import { AVATAR_OPTIONS } from "../context/UserContext";

type DummyMentor = {
  id: string;
  email: string;
  fullName: string;
  avatarId: number;
  isActive: boolean;
};

const DUMMY_MENTORS: DummyMentor[] = [
  { id: "dm1", fullName: "Anita Sharma", email: "anita@mentor.com", avatarId: 1, isActive: true },
  { id: "dm2", fullName: "Vikram Singh", email: "vikram@mentor.com", avatarId: 2, isActive: true },
  { id: "dm3", fullName: "Priya Verma", email: "priya@mentor.com", avatarId: 3, isActive: false },
  { id: "dm4", fullName: "Rahul Yadav", email: "rahul@mentor.com", avatarId: 4, isActive: true },
  { id: "dm5", fullName: "Neha Patel", email: "neha@mentor.com", avatarId: 5, isActive: false },
];

export default function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mentors, setMentors] = useState<AppUser[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const refresh = async () => {
    const b = await listBookings();
    setBookings(b);
    // Use dummy mentor list for Assign Mentor (as requested)
    setMentors(
      DUMMY_MENTORS.map((m) => ({
        id: m.id,
        email: m.email,
        fullName: m.fullName,
        role: "mentor",
        createdAt: Date.now(),
        isActive: m.isActive,
      }))
    );
    if (!selectedBookingId && b.length > 0) setSelectedBookingId(b[0].id);
  };

  useEffect(() => {
    refresh();
  }, []);

  const selectedBooking = useMemo(
    () => bookings.find((b) => b.id === selectedBookingId) ?? null,
    [bookings, selectedBookingId]
  );

  const pendingOrActive = useMemo(() => {
    return [...bookings]
      .filter((b) => b.status === "pending" || b.status === "active")
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [bookings]);

  const assign = async (mentorEmail: string, mentorName: string) => {
    if (!selectedBookingId) return;
    await assignMentorToBooking({ bookingId: selectedBookingId, mentorEmail, mentorName });
    await refresh();
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1A1D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Management</Text>
        <TouchableOpacity onPress={refresh}>
          <Feather name="refresh-cw" size={20} color="#1A1D1F" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Booking picker */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Review Bookings</Text>
          <Text style={styles.sectionSub}>Select a booking to assign a mentor.</Text>

          <View style={styles.bookingList}>
            {pendingOrActive.map((b) => {
              const isSelected = b.id === selectedBookingId;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.bookingItem, isSelected && styles.bookingItemActive]}
                  onPress={() => setSelectedBookingId(b.id)}
                >
                  <View style={[styles.bookingDot, { backgroundColor: b.status === "active" ? "#22C55E" : "#F59E0B" }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bookingTitle, isSelected && { color: "#FFF" }]}>
                      {b.subject}{b.topic ? ` • ${b.topic}` : ""}
                    </Text>
                    <Text style={[styles.bookingSub, isSelected && { color: "rgba(255,255,255,0.85)" }]}>
                      {b.parentName} • {b.mode.toUpperCase()} • {b.status.toUpperCase()}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={isSelected ? "#FFF" : "#6F767E"} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Mentor list */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Assign Mentor</Text>
          <Text style={styles.sectionSub}>
            Green dot = Active, Red dot = Deactive.
          </Text>

          <View style={styles.selectedBookingCard}>
            <Text style={styles.selectedLabel}>Selected Booking</Text>
            <Text style={styles.selectedValue}>
              {selectedBooking
                ? `${selectedBooking.subject}${selectedBooking.topic ? ` • ${selectedBooking.topic}` : ""} — ${selectedBooking.parentName}`
                : "—"}
            </Text>
          </View>

          {mentors.map((m) => {
            const active = m.isActive !== false;
            const avatarId = (() => {
              const dm = DUMMY_MENTORS.find((x) => x.email === m.email);
              return dm?.avatarId ?? 1;
            })();
            const src =
              AVATAR_OPTIONS.find((a) => a.id === avatarId)?.source ?? AVATAR_OPTIONS[0].source;
            return (
              <View key={m.id} style={styles.mentorRow}>
                <View style={[styles.mentorDot, { backgroundColor: active ? "#22C55E" : "#EF4444" }]} />
                <Image source={src} style={styles.mentorAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.mentorName}>{m.fullName}</Text>
                  <Text style={styles.mentorSub}>{m.email}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.assignBtn, !active && styles.assignBtnDisabled]}
                  disabled={!active || !selectedBookingId}
                  onPress={() => assign(m.email, m.fullName)}
                >
                  <Text style={styles.assignBtnText}>Assign</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
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
  scroll: { padding: 16, paddingBottom: 30, gap: 12 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },
  sectionTitle: { fontWeight: "900", color: "#1A1D1F", fontSize: 16 },
  sectionSub: { color: "#6F767E", marginTop: 4 },

  bookingList: { marginTop: 12, gap: 10 },
  bookingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#F4F4F4",
  },
  bookingItemActive: { backgroundColor: "#3F8CFF" },
  bookingDot: { width: 10, height: 10, borderRadius: 10 },
  bookingTitle: { fontWeight: "900", color: "#1A1D1F" },
  bookingSub: { color: "#6F767E", marginTop: 2, fontSize: 12, fontWeight: "700" },

  selectedBookingCard: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: "#0B1220",
    padding: 12,
  },
  selectedLabel: { color: "#9AA0A6", fontWeight: "700", fontSize: 12 },
  selectedValue: { color: "#FFFFFF", fontWeight: "900", marginTop: 4 },

  mentorRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#F4F4F4",
  },
  mentorDot: { width: 10, height: 10, borderRadius: 10 },
  mentorAvatar: { width: 42, height: 42, borderRadius: 16, backgroundColor: "#FFFFFF" },
  mentorName: { fontWeight: "900", color: "#1A1D1F" },
  mentorSub: { color: "#6F767E", marginTop: 2, fontSize: 12 },
  assignBtn: {
    backgroundColor: "#1A1D1F",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  assignBtnDisabled: { opacity: 0.4 },
  assignBtnText: { color: "#FFFFFF", fontWeight: "900" },
});

