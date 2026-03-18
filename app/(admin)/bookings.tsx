import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { Booking } from "../data/models";
import { listBookings } from "../data/repo/repo";

function formatMoney(n: number) {
  return `₹ ${n.toLocaleString("en-IN")}`;
}

function statusDotColor(status: Booking["status"]) {
  if (status === "active") return "#22C55E";
  if (status === "pending") return "#F59E0B";
  if (status === "completed") return "#3F8CFF";
  return "#FF6A55";
}

export default function AdminBookings() {
  const [all, setAll] = useState<Booking[]>([]);

  const refresh = async () => {
    const data = await listBookings();
    setAll(data);
  };

  useEffect(() => {
    refresh();
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const todayCount = all.filter((b) => b.createdAt >= start.getTime()).length;
    const total = all.length;
    // local demo: revenue derived (placeholder)
    const totalRevenue = all.reduce((acc, b) => acc + (b.status === "completed" ? 799 : b.status === "active" ? 499 : 0), 0);
    const avgSession = all.length ? (all.reduce((a, b) => a + (b.mode === "online" ? 1.8 : 2.3), 0) / all.length) : 0;
    return { total, todayCount, totalRevenue, avgSession };
  }, [all]);

  const sorted = useMemo(() => {
    return [...all].sort((a, b) => b.createdAt - a.createdAt);
  }, [all]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1A1D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bookings</Text>
        <TouchableOpacity onPress={refresh}>
          <Feather name="refresh-cw" size={20} color="#1A1D1F" />
        </TouchableOpacity>
      </View>

      {/* Metrics (Book History style) */}
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
          <Text style={styles.metricSub}>Across modes</Text>
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
        {sorted.map((b) => (
          <View key={b.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.dot, { backgroundColor: statusDotColor(b.status) }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{b.subject}{b.topic ? ` • ${b.topic}` : ""}</Text>
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

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Scheduled</Text>
                <Text style={styles.detailValue}>
                  {b.scheduledAt ? new Date(b.scheduledAt).toLocaleString() : "—"}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>{new Date(b.createdAt).toLocaleString()}</Text>
              </View>
            </View>

            {!!b.zoomLink && (
              <View style={styles.zoomRow}>
                <Feather name="video" size={16} color="#3F8CFF" />
                <Text style={styles.zoomText} numberOfLines={1}>
                  {b.zoomLink}
                </Text>
              </View>
            )}

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.push("/(admin)/booking-management" as any)}
              >
                <Feather name="user-check" size={16} color="#FFF" />
                <Text style={styles.primaryBtnText}>Assign Mentor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => router.push("/(admin)/dashboard" as any)}
              >
                <Feather name="grid" size={16} color="#1A1D1F" />
                <Text style={styles.secondaryBtnText}>Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
  zoomRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(63,140,255,0.10)",
    borderRadius: 14,
    padding: 12,
  },
  zoomText: { color: "#1A1D1F", fontWeight: "800", flex: 1 },
  cardActions: { flexDirection: "row", gap: 10, marginTop: 12 },
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
});

