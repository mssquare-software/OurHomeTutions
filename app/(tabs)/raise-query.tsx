import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import type { QueryAttachment } from "../data/models";
import { createQuery } from "../data/repo/repo";
import { useUser } from "../context/UserContext";
import { useLanguage } from "../context/LanguageContext";

const SUBJECT_OPTIONS = [
  "Booking / Payment",
  "Mentor / Session",
  "App Issue",
  "Refund",
  "Other",
] as const;

export default function RaiseQuery() {
  const { email, parentName } = useUser();
  const { t } = useLanguage();
  const [subject, setSubject] = useState<(typeof SUBJECT_OPTIONS)[number]>("App Issue");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<QueryAttachment[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      // Reset form each time user opens this screen
      setSubject("App Issue");
      setMessage("");
      setAttachments([]);
    }, [])
  );

  const canSubmit = useMemo(() => {
    return !!email && !!subject.trim() && message.trim().length >= 5;
  }, [email, message, subject]);

  const onAddAttachment = () => {
    Alert.alert(
      "Upload attachment",
      "To upload PDF/JPG we need to install file pickers (expo-document-picker / expo-image-picker). Your device is currently out of storage, so installs failed. Free some space, then we’ll enable uploads here.",
    );
  };

  const onSubmit = async () => {
    if (!email) {
      Alert.alert("Login required", "Please sign in first.");
      return;
    }
    if (!canSubmit) {
      Alert.alert("Missing details", "Please enter a subject and message (min 5 chars).");
      return;
    }
    await createQuery({
      fromEmail: email,
      fromName: parentName,
      subject,
      message,
      attachments,
    });
    Alert.alert("Submitted", "Your query was sent to Admin.");
    // Clear so user can immediately send another
    setMessage("");
    setAttachments([]);
    router.replace("/(tabs)/parent-dashboard");
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1A1D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("raiseQuery.title")}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("raiseQuery.subject")}</Text>
          <View style={styles.chips}>
            {SUBJECT_OPTIONS.map((s) => {
              const active = s === subject;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSubject(s)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 14 }]}>{t("raiseQuery.message")}</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Write your query..."
            placeholderTextColor="#9AA0A6"
            multiline
            style={styles.messageInput}
          />

          <View style={styles.attachHeader}>
            <Text style={styles.sectionTitle}>{t("raiseQuery.attachments")}</Text>
            <TouchableOpacity style={styles.attachBtn} onPress={onAddAttachment}>
              <Feather name="paperclip" size={16} color="#1A1D1F" />
              <Text style={styles.attachBtnText}>Upload PDF/JPG</Text>
            </TouchableOpacity>
          </View>

          {attachments.length === 0 ? (
            <Text style={styles.muted}>
              No attachments yet.
            </Text>
          ) : (
            <View style={styles.attachmentsRow}>
              {attachments.map((a) => (
                <View key={a.id} style={styles.attachmentChip}>
                  <Feather name={a.type === "image" ? "image" : "file"} size={14} color="#1A1D1F" />
                  <Text style={styles.attachmentText} numberOfLines={1}>{a.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={[styles.primaryBtn, !canSubmit && { opacity: 0.5 }]} disabled={!canSubmit} onPress={onSubmit}>
          <Feather name="send" size={18} color="#FFF" />
          <Text style={styles.primaryText}>{t("raiseQuery.submit")}</Text>
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
  sectionTitle: { fontWeight: "900", color: "#1A1D1F", fontSize: 14 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999, backgroundColor: "#F4F4F4", borderWidth: 1, borderColor: "#E6E8EC" },
  chipActive: { backgroundColor: "#3F8CFF", borderColor: "#3F8CFF" },
  chipText: { fontWeight: "900", color: "#6F767E", fontSize: 12 },
  chipTextActive: { color: "#FFFFFF" },
  messageInput: {
    marginTop: 10,
    backgroundColor: "#F4F4F4",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontWeight: "700",
    color: "#1A1D1F",
    minHeight: 120,
    textAlignVertical: "top",
  },
  attachHeader: { marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  attachBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#F4F4F4", borderRadius: 14 },
  attachBtnText: { fontWeight: "900", color: "#1A1D1F", fontSize: 12 },
  muted: { marginTop: 10, color: "#6F767E", fontWeight: "700" },
  attachmentsRow: { marginTop: 10, gap: 8 },
  attachmentChip: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F4F4F4", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
  attachmentText: { fontWeight: "800", color: "#1A1D1F", maxWidth: 220 },
  primaryBtn: { flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#3F8CFF", borderRadius: 18, paddingVertical: 14 },
  primaryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 16 },
});

