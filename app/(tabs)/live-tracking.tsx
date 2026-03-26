import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useUser } from "../context/UserContext";
import { useNotifications } from "../hooks/useNotifications";

/** Parent live map: waiting until mentor accepts, then simple tracking placeholder */
export default function LiveTrackingScreen() {
  const { email } = useUser();
  const { getBookingsForParent, bookings } = useNotifications();
  const [tick, setTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setTick((t) => t + 1);
    }, [])
  );

  const active = useMemo(() => {
    if (!email) return undefined;
    const mine = getBookingsForParent(email);
    return mine
      .filter((b) => ["pending", "assigned", "accepted", "in_progress"].includes(b.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [email, getBookingsForParent, bookings, tick]);

  // Show "waiting" whenever a mentor is not assigned yet.
  const hasMentorAssigned = Boolean(
    (active as any)?.mentorId || (active as any)?.mentorName
  );

  const waiting =
    active &&
    (!hasMentorAssigned ||
      active.status === "pending" ||
      active.status === "assigned");

  const tracking =
    active &&
    hasMentorAssigned &&
    (active.status === "accepted" ||
      active.status === "in_progress" ||
      active.status === "confirmed");

  const region = {
    latitude: 28.6145,
    longitude: 77.2095,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#E8F4FF", "#F5F0FF"]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Feather name="chevron-left" size={26} color="#0F172A" />
          </Pressable>
          <Text style={styles.title}>Live tracking</Text>
          <View style={{ width: 36 }} />
        </View>

        {!email ? (
          <Text style={styles.centerText}>Sign in to see your session.</Text>
        ) : !active ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No active booking</Text>
            <Text style={styles.cardSub}>
              Hang tight! Book a session first — then you’ll see status here.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            {waiting ? (
              <View style={styles.card}>
                <ActivityIndicator size="large" color="#7F3DFF" />
                <Text style={styles.waitTitle}>Waiting for Assign The Mentor</Text>
                <Text style={styles.waitSub}>
                  Mentor Booking Soon. Your booking is successful and visible on
                  Parent Map. We will update this once a mentor is assigned.
                </Text>
                <Text style={styles.meta}>
                  {active.subject} • {active.hours}h • {active.date} {active.time}
                </Text>
              </View>
            ) : null}

            {tracking ? (
              <View style={styles.card}>
                <Text style={styles.trackTitle}>Mentor on the way</Text>
                <Text style={styles.cardSub}>
                  {active.mentorName ?? "Your mentor"} • ⭐{" "}
                  {active.mentorRating?.toFixed(1) ?? "4.8"} • Code:{" "}
                  <Text style={styles.code}>{active.attendanceCode ?? "—"}</Text>
                </Text>
                <Text style={styles.meta}>
                  ETA to home: {active.time} (live tracking active)
                </Text>
              </View>
            ) : null}

            <View style={styles.mapBox}>
              <MapView style={styles.map} initialRegion={region} scrollEnabled>
                <Marker
                  coordinate={{ latitude: 28.62, longitude: 77.21 }}
                  title={waiting ? "You" : active?.address ?? "Location"}
                />
                {!waiting && (
                  <Marker
                    coordinate={{ latitude: 28.61, longitude: 77.2 }}
                    title={active?.mentorName ?? "Mentor"}
                  />
                )}
              </MapView>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
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
    paddingVertical: 10,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  centerText: { textAlign: "center", marginTop: 40, color: "#64748B" },
  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  cardSub: { marginTop: 8, color: "#64748B", lineHeight: 20 },
  waitTitle: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: "900",
    color: "#7F3DFF",
    textAlign: "center",
  },
  waitSub: { marginTop: 10, color: "#475569", textAlign: "center", lineHeight: 22 },
  meta: { marginTop: 12, textAlign: "center", color: "#94A3B8", fontSize: 13 },
  trackTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  code: { fontWeight: "900", color: "#7F3DFF" },
  mapBox: {
    height: 280,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  map: { flex: 1 },
});
