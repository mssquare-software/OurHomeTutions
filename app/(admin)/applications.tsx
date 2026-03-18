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
import type { MentorApplication } from "../data/models";
import { listApplications } from "../data/repo/repo";

export default function AdminApplications() {
  const [apps, setApps] = useState<MentorApplication[]>([]);

  const refresh = async () => {
    const data = await listApplications();
    setApps(data.sort((a, b) => b.createdAt - a.createdAt));
  };

  useEffect(() => {
    refresh();
  }, []);

  const counts = useMemo(() => {
    const submitted = apps.filter((a) => a.status === "submitted").length;
    const accepted = apps.filter((a) => a.status === "accepted").length;
    const rejected = apps.filter((a) => a.status === "rejected").length;
    return { submitted, accepted, rejected };
  }, [apps]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1A1D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Applications</Text>
        <TouchableOpacity onPress={() => router.push("/(admin)/hr-review" as any)}>
          <Feather name="file-text" size={20} color="#1A1D1F" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: "#F59E0B" }]}>
            <Text style={styles.metricLabel}>Submitted</Text>
            <Text style={styles.metricValue}>{counts.submitted}</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: "#22C55E" }]}>
            <Text style={styles.metricLabel}>Accepted</Text>
            <Text style={styles.metricValue}>{counts.accepted}</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: "#EF4444" }]}>
            <Text style={styles.metricLabel}>Rejected</Text>
            <Text style={styles.metricValue}>{counts.rejected}</Text>
          </View>
        </View>

        {apps.map((a) => (
          <View key={a.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      a.status === "submitted"
                        ? "#F59E0B"
                        : a.status === "accepted"
                        ? "#22C55E"
                        : "#EF4444",
                  },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{a.mentorName}</Text>
                <Text style={styles.sub}>
                  {a.mentorEmail} • {a.subject} • {a.experienceYears ?? 0} yrs
                </Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{a.status.toUpperCase()}</Text>
              </View>
            </View>

            {!!a.resumeUri && (
              <View style={styles.resumeRow}>
                <Feather name="paperclip" size={16} color="#3F8CFF" />
                <Text style={styles.resumeText} numberOfLines={1}>
                  {a.resumeUri}
                </Text>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(admin)/hr-review" as any)}>
                <Feather name="eye" size={16} color="#FFF" />
                <Text style={styles.primaryText}>Open HR Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {apps.length === 0 && (
          <View style={styles.empty}>
            <Feather name="inbox" size={34} color="#6F767E" />
            <Text style={styles.emptyTitle}>No applications</Text>
            <Text style={styles.emptySub}>Applications will appear here when mentors submit.</Text>
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
  metricCard: { flex: 1, borderRadius: 18, padding: 12 },
  metricLabel: { color: "rgba(255,255,255,0.85)", fontWeight: "900", fontSize: 12 },
  metricValue: { color: "#FFF", fontWeight: "900", fontSize: 18, marginTop: 8 },
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
  resumeRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(63,140,255,0.10)",
    borderRadius: 14,
    padding: 10,
  },
  resumeText: { fontWeight: "800", color: "#1A1D1F", flex: 1 },
  actions: { marginTop: 12 },
  primaryBtn: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3F8CFF",
    borderRadius: 18,
    paddingVertical: 14,
  },
  primaryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 },
  empty: { paddingTop: 60, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: "#1A1D1F", marginTop: 8 },
  emptySub: { color: "#6F767E", fontWeight: "700", textAlign: "center", paddingHorizontal: 20 },
});

