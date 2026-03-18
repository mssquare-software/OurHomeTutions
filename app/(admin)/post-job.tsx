import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import type { JobLanguage, JobPost } from "../data/models";
import { addJob } from "../data/repo/repo";

const LANGS: JobLanguage[] = ["English", "Telugu", "Hindi"];

export default function PostJob() {
  const [degreeLevel, setDegreeLevel] = useState("B.Ed");
  const [experience, setExperience] = useState("2+ Years");
  const [classTier, setClassTier] = useState("Class 10");
  const [subject, setSubject] = useState("Mathematics");
  const [language, setLanguage] = useState<JobLanguage>("English");

  const summary = useMemo(() => {
    return `Need a ${subject} tutor for ${classTier}. Degree: ${degreeLevel}. Experience: ${experience}. Language: ${language}.`;
  }, [classTier, degreeLevel, experience, language, subject]);

  const onCreate = async () => {
    const job: Omit<JobPost, "id" | "createdAt"> = {
      criteria: {
        degreeLevel: degreeLevel.trim(),
        experience: experience.trim(),
        classTier: classTier.trim(),
        subject: subject.trim(),
        language,
      },
      summary,
      status: "open",
    };
    await addJob(job);
    router.replace("/(admin)/hr-review");
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1A1D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Job</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Job details</Text>
          <Text style={styles.sub}>Select criteria and the summary will be created automatically.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Degree Level</Text>
            <TextInput value={degreeLevel} onChangeText={setDegreeLevel} style={styles.input} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Experienced</Text>
            <TextInput value={experience} onChangeText={setExperience} style={styles.input} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Class Tier</Text>
            <TextInput value={classTier} onChangeText={setClassTier} style={styles.input} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Subject</Text>
            <TextInput value={subject} onChangeText={setSubject} style={styles.input} />
          </View>

          <Text style={[styles.label, { marginTop: 6 }]}>Language</Text>
          <View style={styles.chips}>
            {LANGS.map((l) => (
              <TouchableOpacity
                key={l}
                onPress={() => setLanguage(l)}
                style={[styles.chip, language === l && styles.chipActive]}
              >
                <Text style={[styles.chipText, language === l && styles.chipTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.cardDark}>
          <Text style={styles.darkLabel}>Job summary</Text>
          <Text style={styles.darkValue}>{summary}</Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={onCreate}>
          <Feather name="plus-circle" size={18} color="#FFF" />
          <Text style={styles.primaryText}>Create Job</Text>
        </TouchableOpacity>
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
  title: { fontWeight: "900", fontSize: 16, color: "#1A1D1F" },
  sub: { color: "#6F767E", marginTop: 4 },
  field: { marginTop: 12 },
  label: { fontWeight: "800", color: "#1A1D1F" },
  input: {
    marginTop: 8,
    backgroundColor: "#F4F4F4",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontWeight: "700",
    color: "#1A1D1F",
  },
  chips: { flexDirection: "row", gap: 10, marginTop: 10, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F4F4F4",
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },
  chipActive: { backgroundColor: "#3F8CFF", borderColor: "#3F8CFF" },
  chipText: { fontWeight: "900", color: "#6F767E" },
  chipTextActive: { color: "#FFFFFF" },

  cardDark: {
    backgroundColor: "#0B1220",
    borderRadius: 20,
    padding: 14,
  },
  darkLabel: { color: "#9AA0A6", fontWeight: "700", fontSize: 12 },
  darkValue: { color: "#FFFFFF", fontWeight: "900", marginTop: 8, lineHeight: 20 },

  primaryBtn: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3F8CFF",
    borderRadius: 18,
    paddingVertical: 14,
  },
  primaryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 16 },
});

