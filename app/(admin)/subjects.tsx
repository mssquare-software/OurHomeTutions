import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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
import { router } from "expo-router";
import type { Subject } from "../data/models";
import {
  addSubject,
  addTopicToSubject,
  listSubjects,
  removeSubject,
  removeTopicFromSubject,
} from "../data/repo/repo";
import { useLanguage } from "../context/LanguageContext";

export default function AdminSubjects() {
  const { t } = useLanguage();
  const [items, setItems] = useState<Subject[]>([]);
  const [name, setName] = useState("");
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [topicName, setTopicName] = useState("");

  const refresh = async () => {
    const data = await listSubjects();
    setItems(data.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  useEffect(() => {
    refresh();
  }, []);

  const onAdd = async () => {
    if (!name.trim()) return;
    await addSubject(name);
    setName("");
    await refresh();
  };

  const onDelete = async (id: string) => {
    Alert.alert("Delete subject?", "This will remove the subject from admin & parent lists.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removeSubject(id);
          await refresh();
        },
      },
    ]);
  };

  const onAddTopic = async (subjectId: string) => {
    if (!topicName.trim()) return;
    await addTopicToSubject(subjectId, topicName);
    setTopicName("");
    await refresh();
  };

  const onDeleteTopic = async (subjectId: string, topicId: string) => {
    await removeTopicFromSubject(subjectId, topicId);
    await refresh();
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1A1D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("subjects.title")}</Text>
        <TouchableOpacity onPress={refresh}>
          <Feather name="refresh-cw" size={20} color="#1A1D1F" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("subjects.addSubject")}</Text>
          <Text style={styles.sectionSub}>Subject changes will reflect in Parent flows (dynamic).</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Subject Name"
            placeholderTextColor="#9AA0A6"
            style={styles.input}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={onAdd}>
            <Feather name="plus" size={18} color="#FFF" />
            <Text style={styles.primaryText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("subjects.allSubjects")}</Text>
          {items.map((s) => {
            const isEditing = editingSubjectId === s.id;
            return (
              <View key={s.id} style={styles.row}>
                <View style={styles.dot} />
                <View style={{ flex: 1 }}>
                  <View style={styles.rowHeader}>
                    <Text style={styles.rowTitle}>{s.name}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setEditingSubjectId((prev) => (prev === s.id ? null : s.id))
                      }
                    >
                      <Text style={styles.manageText}>
                        {isEditing ? t("subjects.hideTopics") : t("subjects.manageTopics")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.rowSub}>
                    Topics: {s.topics.length} • Updated:{" "}
                    {new Date(s.updatedAt).toLocaleDateString()}
                  </Text>

                  {isEditing && (
                    <View style={styles.topicsSection}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.topicsRow}
                      >
                        {s.topics.map((t) => (
                          <View key={t.id} style={styles.topicChip}>
                            <Text style={styles.topicText}>{t.name}</Text>
                            <TouchableOpacity
                              onPress={() => onDeleteTopic(s.id, t.id)}
                              style={styles.topicRemove}
                            >
                              <Feather name="x" size={12} color="#FFF" />
                            </TouchableOpacity>
                          </View>
                        ))}
                        {s.topics.length === 0 && (
                          <Text style={styles.noTopicsText}>No topics yet.</Text>
                        )}
                      </ScrollView>

                      <View style={styles.topicInputRow}>
                        <TextInput
                          value={topicName}
                          onChangeText={setTopicName}
                          placeholder="New topic name"
                          placeholderTextColor="#9AA0A6"
                          style={[styles.input, styles.topicInput]}
                        />
                        <TouchableOpacity
                          style={styles.addTopicBtn}
                          onPress={() => onAddTopic(s.id)}
                        >
                          <Feather name="plus" size={16} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(s.id)}>
                  <Feather name="trash-2" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            );
          })}
          {items.length === 0 && <Text style={styles.muted}>No subjects yet.</Text>}
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
  sectionTitle: { fontWeight: "900", color: "#1A1D1F", fontSize: 16 },
  sectionSub: { color: "#6F767E", marginTop: 4 },
  input: {
    marginTop: 12,
    backgroundColor: "#F4F4F4",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontWeight: "700",
    color: "#1A1D1F",
  },
  primaryBtn: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3F8CFF",
    borderRadius: 18,
    paddingVertical: 14,
  },
  primaryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 16 },
  row: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#F4F4F4",
  },
  dot: { width: 10, height: 10, borderRadius: 10, backgroundColor: "#3F8CFF" },
  rowTitle: { fontWeight: "900", color: "#1A1D1F" },
  rowSub: { color: "#6F767E", marginTop: 2, fontSize: 12 },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FF6A55",
    alignItems: "center",
    justifyContent: "center",
  },
  muted: { marginTop: 12, color: "#6F767E", fontWeight: "700" },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  manageText: { color: "#3F8CFF", fontWeight: "800", fontSize: 12 },
  topicsSection: { marginTop: 8 },
  topicsRow: { gap: 8, paddingVertical: 4 },
  topicChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#0B1220",
    borderRadius: 999,
  },
  topicText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
  topicRemove: {
    marginLeft: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  noTopicsText: { color: "#6F767E", fontWeight: "700" },
  topicInputRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  topicInput: { flex: 1, marginTop: 0 },
  addTopicBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#3F8CFF",
    alignItems: "center",
    justifyContent: "center",
  },
});

