import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { AVATAR_OPTIONS } from "../context/UserContext";
import type { AppUser } from "../data/models";
import { listUsers } from "../data/repo/repo";

const AVATAR_STORAGE_KEY = "parent_avatar";

type MentorRow = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  avatarId: number;
  // dummy fields until supabase/backend exists
  age: number;
  subject: string;
  degree: string;
  rating: number;
};

export default function AdminMentors() {
  const [q, setQ] = useState("");
  const [mentors, setMentors] = useState<MentorRow[]>([]);

  useEffect(() => {
    (async () => {
      const users = await listUsers();
      const ms = users.filter((u) => u.role === "mentor");

      const withAvatar = await Promise.all(
        ms.map(async (m) => {
          const raw = await AsyncStorage.getItem(`${AVATAR_STORAGE_KEY}_${m.email}`);
          const avatarId = Math.max(1, Math.min(Number(raw) || 1, AVATAR_OPTIONS.length));
          return { m, avatarId } as const;
        })
      );

      // Map repo mentors to UI rows; add dummy profile fields for now
      const rows: MentorRow[] = withAvatar.map(({ m, avatarId }, idx) => ({
        id: m.id,
        email: m.email,
        fullName: m.fullName,
        isActive: m.isActive !== false,
        avatarId,
        age: 23 + ((idx * 3) % 9),
        subject: ["Mathematics", "Science", "English", "Hindi", "Social Studies"][idx % 5],
        degree: ["B.Ed", "M.Ed", "B.Tech + B.Ed", "B.A + B.Ed", "M.Sc"][idx % 5],
        rating: [4.8, 4.6, 4.7, 4.4, 4.5][idx % 5],
      }));

      // Show active mentors (today's active) by default as requested
      setMentors(rows.filter((r) => r.isActive));
    })();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return mentors;
    return mentors.filter(
      (m) =>
        m.fullName.toLowerCase().includes(t) ||
        m.email.toLowerCase().includes(t) ||
        m.subject.toLowerCase().includes(t) ||
        m.degree.toLowerCase().includes(t)
    );
  }, [q, mentors]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1A1D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mentors</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.searchCard}>
          <Feather name="search" size={18} color="#6F767E" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search mentor, subject, degree..."
            placeholderTextColor="#9AA0A6"
            style={styles.searchInput}
          />
        </View>

        {filtered.map((m) => {
          const src =
            AVATAR_OPTIONS.find((a) => a.id === m.avatarId)?.source ?? AVATAR_OPTIONS[0].source;
          return (
            <View key={m.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: m.isActive ? "#22C55E" : "#EF4444" },
                  ]}
                />
                <Image source={src} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{m.fullName}</Text>
                  <Text style={styles.sub}>
                    Age: {m.age} • {m.subject}
                  </Text>
                  <Text style={styles.sub}>{m.degree}</Text>
                  <Text style={styles.sub}>{m.email}</Text>
                </View>
                <View style={styles.ratingPill}>
                  <Feather name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{m.rating.toFixed(1)}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Feather name="users" size={34} color="#6F767E" />
            <Text style={styles.emptyTitle}>No mentors found</Text>
            <Text style={styles.emptySub}>Try a different search.</Text>
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
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },
  searchInput: { flex: 1, fontWeight: "700", color: "#1A1D1F", paddingVertical: 6 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 10 },
  avatar: { width: 48, height: 48, borderRadius: 18, backgroundColor: "#F4F4F4" },
  name: { fontWeight: "900", color: "#1A1D1F" },
  sub: { color: "#6F767E", marginTop: 2, fontSize: 12, fontWeight: "700" },
  ratingPill: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    backgroundColor: "#F4F4F4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  ratingText: { fontWeight: "900", color: "#1A1D1F" },
  empty: { paddingTop: 60, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: "#1A1D1F", marginTop: 8 },
  emptySub: { color: "#6F767E", fontWeight: "700" },
});

