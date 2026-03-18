import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import type { JobPost } from "../data/models";
import { listJobs } from "../data/repo/repo";

export default function AdminJobs() {
  const [jobs, setJobs] = useState<JobPost[]>([]);

  const refresh = async () => {
    const data = await listJobs();
    setJobs(data.sort((a, b) => b.createdAt - a.createdAt));
  };

  useEffect(() => {
    refresh();
  }, []);

  const openCount = useMemo(() => jobs.filter((j) => j.status === "open").length, [jobs]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1A1D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Jobs</Text>
        <TouchableOpacity onPress={() => router.push("/(admin)/post-job" as any)}>
          <Feather name="plus" size={22} color="#1A1D1F" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: "#3F8CFF" }]}>
            <Text style={styles.metricLabel}>Open</Text>
            <Text style={styles.metricValue}>{openCount}</Text>
            <Text style={styles.metricSub}>Jobs</Text>
          </View>
          <TouchableOpacity
            style={[styles.metricCard, { backgroundColor: "#1A1D1F" }]}
            onPress={() => router.push("/(admin)/hr-review" as any)}
          >
            <Text style={styles.metricLabel}>HR</Text>
            <Text style={styles.metricValue}>Review</Text>
            <Text style={styles.metricSub}>Applications</Text>
          </TouchableOpacity>
        </View>

        {jobs.map((j) => (
          <View key={j.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.dot, { backgroundColor: j.status === "open" ? "#22C55E" : "#6F767E" }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {j.criteria.subject} • {j.criteria.classTier}
                </Text>
                <Text style={styles.sub}>
                  {j.criteria.degreeLevel} • {j.criteria.experience} • {j.criteria.language}
                </Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{j.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.summary}>{j.summary}</Text>
            <Text style={styles.time}>{new Date(j.createdAt).toLocaleString()}</Text>
          </View>
        ))}

        {jobs.length === 0 && (
          <View style={styles.empty}>
            <Feather name="briefcase" size={34} color="#6F767E" />
            <Text style={styles.emptyTitle}>No jobs yet</Text>
            <Text style={styles.emptySub}>Tap + to post a new job.</Text>
          </View>
        )}
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
  metricsRow: { flexDirection: "row", gap: 10 },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
  },
  metricLabel: { color: "rgba(255,255,255,0.85)", fontWeight: "800" },
  metricValue: { color: "#FFF", fontWeight: "900", fontSize: 18, marginTop: 10 },
  metricSub: { color: "rgba(255,255,255,0.75)", fontWeight: "700", marginTop: 4 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 10 },
  title: { fontWeight: "900", color: "#1A1D1F" },
  sub: { color: "#6F767E", marginTop: 2, fontSize: 12 },
  pill: { backgroundColor: "#F4F4F4", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  pillText: { fontWeight: "900", color: "#1A1D1F", fontSize: 12 },
  summary: { marginTop: 10, color: "#1A1D1F", lineHeight: 20 },
  time: { marginTop: 10, color: "#6F767E", fontWeight: "700", fontSize: 12 },
  empty: { paddingTop: 60, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: "#1A1D1F", marginTop: 8 },
  emptySub: { color: "#6F767E", fontWeight: "700" },
});

