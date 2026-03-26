import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useUser } from "../context/UserContext";
import type { MentorAdminRequest } from "../data/models";
import { listMentorRequestsForEmail, updateMentorRequestStatus } from "../data/repo/repo";

export default function MentorInboxScreen() {
  const { parentName, email } = useUser();
  const [items, setItems] = useState<MentorAdminRequest[]>([]);

  const refresh = useCallback(async () => {
    if (!email) return;
    const all = await listMentorRequestsForEmail(email);
    setItems(all.filter((r) => r.status === "pending"));
  }, [email]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const decide = async (r: MentorAdminRequest, status: "accepted" | "rejected") => {
    await updateMentorRequestStatus({ id: r.id, status });
    Alert.alert(status === "accepted" ? "Accepted" : "Rejected", "Response recorded.");
    refresh();
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
          <Text style={styles.title}>Inbox</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.hi}>
          Hi {parentName.split(" ")[0] ?? "Mentor"} — pending requests from Admin
        </Text>
        <ScrollView contentContainerStyle={styles.scroll}>
          {items.map((r) => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.cardTitle}>Parent: {r.parentName}</Text>
              <Text style={styles.row}>📍 {r.parentLocation}</Text>
              <Text style={styles.price}>
                ₹ {r.priceAmount} {r.currency ?? "INR"}
              </Text>
              {r.notes ? <Text style={styles.notes}>{r.notes}</Text> : null}
              <View style={styles.actions}>
                <Pressable
                  style={[styles.btn, styles.reject]}
                  onPress={() => decide(r, "rejected")}
                >
                  <Text style={styles.rejectText}>Reject</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.accept]}
                  onPress={() => decide(r, "accepted")}
                >
                  <Text style={styles.acceptText}>Accept</Text>
                </Pressable>
              </View>
            </View>
          ))}
          {items.length === 0 && (
            <Text style={styles.empty}>No pending requests.</Text>
          )}
        </ScrollView>
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
  hi: { paddingHorizontal: 16, marginBottom: 8, color: "#6B7280", fontWeight: "600" },
  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F3E8FF",
  },
  cardTitle: { fontSize: 17, fontWeight: "800", color: "#1F2937" },
  row: { marginTop: 6, color: "#4B5563" },
  price: { marginTop: 8, fontSize: 20, fontWeight: "900", color: "#8F54FF" },
  notes: { marginTop: 8, color: "#6B7280", fontSize: 13 },
  actions: { flexDirection: "row", gap: 12, marginTop: 16 },
  btn: { flex: 1, padding: 14, borderRadius: 14, alignItems: "center" },
  reject: { backgroundColor: "#FEE2E2" },
  accept: { backgroundColor: "#8F54FF" },
  rejectText: { fontWeight: "900", color: "#B91C1C" },
  acceptText: { fontWeight: "900", color: "#FFF" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 32 },
});
