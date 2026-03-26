import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { BookingRequest } from "../../constants/notificationTypes";
import { useUser } from "../context/UserContext";
import { useNotifications } from "../hooks/useNotifications";

/** Mentor: accept/reject assigned bookings, attendance code, session progress, notify parent near arrival */
export default function MentorSessionBookingsScreen() {
  const { email } = useUser();
  const {
    bookings,
    getBookingsForMentor,
    acceptBooking,
    rejectBooking,
    markAttendance,
    completeBooking,
    sendNearArrivalCodeToParent,
  } = useNotifications();

  const [tick, setTick] = useState(0);
  const [codeInput, setCodeInput] = useState<Record<string, string>>({});
  const fillAnims = useRef<Record<string, Animated.Value>>({});

  useFocusEffect(
    useCallback(() => {
      setTick((t) => t + 1);
    }, [])
  );

  const mine = useMemo(() => {
    if (!email) return [];
    return getBookingsForMentor(email).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [email, getBookingsForMentor, bookings, tick]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySessions = useMemo(
    () =>
      mine.filter(
        (b) =>
          b.date === todayStr &&
          ["assigned", "accepted", "in_progress", "confirmed", "completed"].includes(
            b.status
          )
      ),
    [mine, todayStr]
  );
  const todayDone = todaySessions.filter((b) => b.status === "completed");
  const dayProgressPct =
    todaySessions.length === 0
      ? 0
      : Math.round((todayDone.length / todaySessions.length) * 100);

  const onAccept = async (bookingId: string) => {
    if (!email) return;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Location needed",
        "Please allow location so the parent can track you on the way."
      );
      return;
    }
    await acceptBooking(bookingId, email);
    Alert.alert("Accepted", "Parent and admin have been notified.");
    setTick((t) => t + 1);
  };

  const onReject = async (bookingId: string) => {
    if (!email) return;
    await rejectBooking(bookingId, email);
    Alert.alert("Rejected", "Admin can assign another mentor.");
    setTick((t) => t + 1);
  };

  const getFillAnim = (bookingId: string) => {
    if (!fillAnims.current[bookingId]) {
      fillAnims.current[bookingId] = new Animated.Value(0);
    }
    return fillAnims.current[bookingId];
  };

  const runWaterFill = (bookingId: string) => {
    const v = getFillAnim(bookingId);
    v.setValue(0);
    Animated.timing(v, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: false,
    }).start();
  };

  const onVerifyAttendance = async (bookingId: string) => {
    if (!email) return;
    const code = (codeInput[bookingId] ?? "").trim();
    const ok = await markAttendance(bookingId, email, code);
    if (!ok) {
      Alert.alert("Invalid code", "Check the code shown to the parent.");
      return;
    }
    runWaterFill(bookingId);
    Alert.alert("Verified", "Attendance recorded — admin notified.");
    setTick((t) => t + 1);
  };

  const onComplete = async (bookingId: string) => {
    await completeBooking(bookingId);
    Alert.alert("Completed", "Parent can now rate the session.");
    setTick((t) => t + 1);
  };

  const onNearArrival = async (bookingId: string) => {
    await sendNearArrivalCodeToParent(bookingId);
    Alert.alert("Sent", "Parent received the attendance code again.");
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color="#1A1D1F" />
        </Pressable>
        <Text style={styles.title}>Sessions & attendance</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Today’s completion</Text>
        <Text style={styles.summaryPct}>{dayProgressPct}%</Text>
        <Text style={styles.summarySub}>
          {todayDone.length} / {todaySessions.length} sessions completed today
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {mine.length === 0 ? (
          <Text style={styles.empty}>No bookings assigned yet.</Text>
        ) : (
          mine.map((b) => {
            const assigned = b.status === "assigned";
            const active =
              b.status === "accepted" ||
              b.status === "in_progress" ||
              b.status === "confirmed";
            const done = b.status === "completed";
            const fillAnim = getFillAnim(b.id);

            return (
              <SessionCard
                key={b.id}
                b={b}
                assigned={assigned}
                active={active}
                done={done}
                fillAnim={fillAnim}
                codeInput={codeInput}
                setCodeInput={setCodeInput}
                onAccept={onAccept}
                onReject={onReject}
                onVerifyAttendance={onVerifyAttendance}
                onNearArrival={onNearArrival}
                onComplete={onComplete}
              />
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type CardProps = {
  b: BookingRequest;
  assigned: boolean;
  active: boolean;
  done: boolean;
  fillAnim: Animated.Value;
  codeInput: Record<string, string>;
  setCodeInput: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onVerifyAttendance: (id: string) => void;
  onNearArrival: (id: string) => void;
  onComplete: (id: string) => void;
};

function SessionCard({
  b,
  assigned,
  active,
  done,
  fillAnim,
  codeInput,
  setCodeInput,
  onAccept,
  onReject,
  onVerifyAttendance,
  onNearArrival,
  onComplete,
}: CardProps) {
  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  {b.subject} • {b.hours}h
                </Text>
                <Text style={styles.row}>Parent: {b.parentName}</Text>
                <Text style={styles.row}>Child: {b.childName}</Text>
                <Text style={styles.row}>
                  📅 {b.date} {b.time}
                </Text>
                <Text style={styles.row}>📍 {b.address ?? "—"}</Text>
                <Text style={styles.row}>📞 {b.contact}</Text>
                <Text style={styles.price}>₹{b.price ?? "—"}</Text>
                <Text style={styles.status}>Status: {b.status}</Text>

                {assigned ? (
                  <View style={styles.actions}>
                    <Pressable
                      style={[styles.btn, styles.reject]}
                      onPress={() => onReject(b.id)}
                    >
                      <Text style={styles.rejectText}>Reject</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.btn, styles.accept]}
                      onPress={() => onAccept(b.id)}
                    >
                      <Text style={styles.acceptText}>Accept</Text>
                    </Pressable>
                  </View>
                ) : null}

                {active || done ? (
                  <View style={styles.attBlock}>
                    <Text style={styles.attTitle}>Attendance code (alphanumeric)</Text>
                    <Text style={styles.codeBig}>{b.attendanceCode ?? "—"}</Text>
                    <Text style={styles.hint}>
                      Enter the same code below when you reach the location to verify.
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter code"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                      value={codeInput[b.id] ?? ""}
                      onChangeText={(t) =>
                        setCodeInput((prev) => ({ ...prev, [b.id]: t }))
                      }
                    />
                    {!b.attendanceMarkedAt && !done ? (
                      <Pressable
                        style={styles.primaryBtn}
                        onPress={() => onVerifyAttendance(b.id)}
                      >
                        <Text style={styles.primaryBtnText}>Verify attendance</Text>
                      </Pressable>
                    ) : null}

                    {!done ? (
                      <Pressable
                        style={styles.secondaryBtn}
                        onPress={() => onNearArrival(b.id)}
                      >
                        <Text style={styles.secondaryBtnText}>
                          Almost there — resend code to parent
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}

                {b.status === "in_progress" ? (
                  <View style={styles.waterOuter}>
                    <Text style={styles.waterLabel}>Session in progress</Text>
                    <View style={styles.waterTrack}>
                      <Animated.View
                        style={[styles.waterFill, { height: fillHeight }]}
                      />
                    </View>
                    <Pressable
                      style={[styles.primaryBtn, { marginTop: 12 }]}
                      onPress={() => onComplete(b.id)}
                    >
                      <Text style={styles.primaryBtnText}>Complete session</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
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
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  summary: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    marginBottom: 8,
  },
  summaryLabel: { color: "#4338CA", fontWeight: "700" },
  summaryPct: { fontSize: 36, fontWeight: "900", color: "#3730A3" },
  summarySub: { color: "#6366F1", marginTop: 4 },
  scroll: { padding: 16, paddingBottom: 48 },
  empty: { textAlign: "center", color: "#94A3B8", marginTop: 24 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  row: { marginTop: 6, color: "#475569" },
  price: { marginTop: 10, fontSize: 18, fontWeight: "900", color: "#7F3DFF" },
  status: { marginTop: 8, fontWeight: "700", color: "#64748B" },
  actions: { flexDirection: "row", gap: 12, marginTop: 16 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: "center" },
  reject: { backgroundColor: "#FEE2E2" },
  accept: { backgroundColor: "#DCFCE7" },
  rejectText: { fontWeight: "800", color: "#B91C1C" },
  acceptText: { fontWeight: "800", color: "#166534" },
  attBlock: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
  },
  attTitle: { fontWeight: "800", color: "#334155" },
  codeBig: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 4,
    color: "#7F3DFF",
    marginTop: 8,
  },
  hint: { marginTop: 8, color: "#64748B", fontSize: 12 },
  input: {
    marginTop: 10,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontWeight: "700",
  },
  primaryBtn: {
    marginTop: 10,
    backgroundColor: "#7F3DFF",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#FFF", fontWeight: "800" },
  secondaryBtn: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryBtnText: { color: "#0EA5E9", fontWeight: "800" },
  waterOuter: { marginTop: 16 },
  waterLabel: { fontWeight: "800", marginBottom: 8 },
  waterTrack: {
    height: 120,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  waterFill: {
    width: "100%",
    backgroundColor: "#3B82F6",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
});
