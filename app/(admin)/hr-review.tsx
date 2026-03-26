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
import type { JobPost, MentorApplication } from "../data/models";
import { listApplications, listJobs, updateApplicationStatus } from "../data/repo/repo";
import { sendHRDecisionEmail } from "../services/emailService";

export default function HRReview() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [apps, setApps] = useState<MentorApplication[]>([]);

  const refresh = async () => {
    const [j, a] = await Promise.all([listJobs(), listApplications()]);
    setJobs(j.sort((x, y) => y.createdAt - x.createdAt));
    setApps(a.sort((x, y) => y.createdAt - x.createdAt));
  };

  useEffect(() => {
    refresh();
  }, []);

  const openJobs = useMemo(() => jobs.filter((j) => j.status === "open"), [jobs]);

  const decide = async (app: MentorApplication, status: "accepted" | "rejected") => {
    await updateApplicationStatus({ applicationId: app.id, status });
    await sendHRDecisionEmail({
      fullName: app.mentorName,
      email: app.mentorEmail,
      decision: status,
      jobTitle: `${app.subject} Mentor`,
    });
    await refresh();
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1A1D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HR Review</Text>
        <TouchableOpacity onPress={() => router.push("/(admin)/post-job" as any)}>
          <Feather name="plus" size={22} color="#1A1D1F" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.sectionTop}>
            <Text style={styles.sectionTitle}>Open Jobs</Text>
            <Text style={styles.sectionCount}>{openJobs.length}</Text>
          </View>
          {openJobs.map((j) => (
            <View key={j.id} style={styles.jobRow}>
              <View style={styles.jobDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.jobTitle}>{j.criteria.subject} • {j.criteria.classTier}</Text>
                <Text style={styles.jobSub}>{j.summary}</Text>
              </View>
            </View>
          ))}
          {openJobs.length === 0 && <Text style={styles.muted}>No open jobs.</Text>}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTop}>
            <Text style={styles.sectionTitle}>Job Applications</Text>
            <Text style={styles.sectionCount}>{apps.length}</Text>
          </View>

          {apps.map((a) => (
            <View key={a.id} style={styles.appCard}>
              <View style={styles.appTop}>
                <View style={[styles.statusDot, { backgroundColor: a.status === "submitted" ? "#F59E0B" : a.status === "accepted" ? "#22C55E" : "#EF4444" }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.appName}>{a.mentorName}</Text>
                  <Text style={styles.appSub}>
                    {a.mentorEmail} • {a.subject} • {a.experienceYears ?? 0} yrs
                  </Text>
                  {(a.contactPhone || a.contactEmail || a.jobId) ? (
                    <Text style={styles.appExtra}>
                      {[a.contactPhone && `📞 ${a.contactPhone}`, a.contactEmail && `✉️ ${a.contactEmail}`, a.jobId && `Job: ${a.jobId.slice(0, 8)}…`].filter(Boolean).join(" • ")}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{a.status.toUpperCase()}</Text>
                </View>
              </View>

              {!!a.resumeUri && (
                <View style={styles.resumeRow}>
                  <Feather name="file-text" size={16} color="#3F8CFF" />
                  <Text style={styles.resumeText} numberOfLines={1}>{a.resumeUri}</Text>
                </View>
              )}

              {a.status === "submitted" ? (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => decide(a, "accepted")}>
                    <Feather name="check" size={16} color="#FFF" />
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => decide(a, "rejected")}>
                    <Feather name="x" size={16} color="#FFF" />
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.muted}>Decision sent (saved to email outbox).</Text>
              )}
            </View>
          ))}
          {apps.length === 0 && <Text style={styles.muted}>No applications yet.</Text>}
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
  sectionTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontWeight: "900", color: "#1A1D1F", fontSize: 16 },
  sectionCount: {
    backgroundColor: "#F4F4F4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: "900",
    color: "#1A1D1F",
  },
  jobRow: { marginTop: 12, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  jobDot: { width: 10, height: 10, borderRadius: 10, backgroundColor: "#3F8CFF", marginTop: 5 },
  jobTitle: { fontWeight: "900", color: "#1A1D1F" },
  jobSub: { color: "#6F767E", marginTop: 2, lineHeight: 18 },

  appCard: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: "#F4F4F4",
    padding: 12,
  },
  appTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 10 },
  appName: { fontWeight: "900", color: "#1A1D1F" },
  appSub: { color: "#6F767E", marginTop: 2, fontSize: 12 },
  appExtra: { color: "#3F8CFF", marginTop: 4, fontSize: 11, fontWeight: "600" },
  pill: { backgroundColor: "#FFFFFF", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
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

  actions: { flexDirection: "row", gap: 10, marginTop: 10 },
  acceptBtn: {
    flex: 1,
    backgroundColor: "#22C55E",
    borderRadius: 16,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptText: { color: "#FFFFFF", fontWeight: "900" },
  rejectBtn: {
    flex: 1,
    backgroundColor: "#EF4444",
    borderRadius: 16,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectText: { color: "#FFFFFF", fontWeight: "900" },
  muted: { marginTop: 12, color: "#6F767E", fontWeight: "700" },
});

