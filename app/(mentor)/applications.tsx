import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useUser } from "../context/UserContext";
import type { JobPost } from "../data/models";
import { createMentorApplication, listJobs } from "../data/repo/repo";

export default function MentorApplicationsScreen() {
  const { parentName, email } = useUser();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [selected, setSelected] = useState<JobPost | null>(null);
  const [contactName, setContactName] = useState(parentName);
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState(email ?? "");
  const [resumeNote, setResumeNote] = useState("");

  const load = async () => {
    const j = await listJobs();
    setJobs(j.filter((x) => x.status === "open").sort((a, b) => b.createdAt - a.createdAt));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setContactName(parentName);
    setContactEmail(email ?? "");
  }, [parentName, email]);

  const openApply = (job: JobPost) => {
    setSelected(job);
    setResumeNote("");
  };

  const submit = async () => {
    if (!selected || !email) return;
    if (!contactName.trim() || !contactPhone.trim() || !contactEmail.trim()) {
      Alert.alert("Missing fields", "Please enter name, phone, and email.");
      return;
    }
    try {
      await createMentorApplication({
        jobId: selected.id,
        mentorEmail: email.trim().toLowerCase(),
        mentorName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        subject: selected.criteria.subject,
        experienceYears: 0,
        resumeUri: resumeNote.trim() || "resume://pending-upload",
      });
      Alert.alert("Submitted", "Your application is sent to HR for review.");
      setSelected(null);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not submit.");
    }
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
          <Text style={styles.title}>Job openings</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.sub}>
            Apply with your details and CV (PDF/DOCX). HR sees submissions in the HR Portal.
          </Text>
          {jobs.map((job) => (
            <Pressable key={job.id} style={styles.card} onPress={() => openApply(job)}>
              <View style={styles.dot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.jobTitle}>
                  {job.criteria.subject} • {job.criteria.classTier}
                </Text>
                <Text style={styles.jobSum} numberOfLines={3}>
                  {job.summary}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color="#8F54FF" />
            </Pressable>
          ))}
          {jobs.length === 0 && (
            <Text style={styles.empty}>No open jobs right now.</Text>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Apply</Text>
            {selected && (
              <Text style={styles.modalJob}>{selected.criteria.subject}</Text>
            )}
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              value={contactName}
              onChangeText={setContactName}
            />
            <Text style={styles.label}>Contact phone</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={contactPhone}
              onChangeText={setContactPhone}
            />
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={contactEmail}
              onChangeText={setContactEmail}
            />
            <Text style={styles.label}>Resume (file name or URI)</Text>
            <TextInput
              style={[styles.input, { minHeight: 72 }]}
              multiline
              placeholder="e.g. resume.pdf — attach flow can use Document Picker later"
              placeholderTextColor="#9CA3AF"
              value={resumeNote}
              onChangeText={setResumeNote}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setSelected(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.submitBtn} onPress={submit}>
                <Text style={styles.submitText}>Submit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  sub: { fontSize: 13, color: "#6B7280", marginBottom: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3E8FF",
    gap: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#22C55E" },
  jobTitle: { fontSize: 16, fontWeight: "800", color: "#1F2937" },
  jobSum: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 24 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1A1D1F" },
  modalJob: { fontSize: 14, color: "#8F54FF", fontWeight: "700", marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "700", color: "#6B7280", marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    fontSize: 15,
    color: "#111827",
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  cancelText: { fontWeight: "800", color: "#374151" },
  submitBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#8F54FF",
    alignItems: "center",
  },
  submitText: { fontWeight: "800", color: "#FFF" },
});
