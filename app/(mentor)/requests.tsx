import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useUser } from "../context/UserContext";
import type { MentorAdminRequest } from "../data/models";
import { listMentorRequestsForEmail } from "../data/repo/repo";

export default function MentorRequestsScreen() {
  const { email } = useUser();
  const [items, setItems] = useState<MentorAdminRequest[]>([]);

  const refresh = useCallback(async () => {
    if (!email) return;
    const all = await listMentorRequestsForEmail(email);
    setItems(all);
  }, [email]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const pill = (s: MentorAdminRequest["status"]) => {
    if (s === "pending") return { bg: "#FEF3C7", fg: "#B45309", label: "Pending" };
    if (s === "accepted") return { bg: "#DCFCE7", fg: "#166534", label: "Accepted" };
    return { bg: "#FEE2E2", fg: "#B91C1C", label: "Rejected" };
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
          <Text style={styles.title}>Requests</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          {items.map((r) => {
            const p = pill(r.status);
            return (
              <View key={r.id} style={styles.card}>
                <View style={styles.rowTop}>
                  <Text style={styles.name}>{r.parentName}</Text>
                  <View style={[styles.pill, { backgroundColor: p.bg }]}>
                    <Text style={[styles.pillText, { color: p.fg }]}>{p.label}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>📍 {r.parentLocation}</Text>
                <Text style={styles.price}>
                  ₹ {r.priceAmount} {r.currency ?? ""}
                </Text>
              </View>
            );
          })}
          {items.length === 0 && (
            <Text style={styles.empty}>No requests yet.</Text>
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
  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3E8FF",
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "800", color: "#1F2937", flex: 1 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pillText: { fontSize: 11, fontWeight: "900" },
  meta: { marginTop: 8, color: "#6B7280" },
  price: { marginTop: 6, fontSize: 18, fontWeight: "900", color: "#8F54FF" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 32 },
});
