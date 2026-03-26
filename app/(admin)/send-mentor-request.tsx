import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import type { AppUser } from "../data/models";
import { createMentorAdminRequest, listUsers } from "../data/repo/repo";

export default function SendMentorRequestScreen() {
  const [mentors, setMentors] = useState<AppUser[]>([]);
  const [mentorEmail, setMentorEmail] = useState("");
  const [parentName, setParentName] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    (async () => {
      const u = await listUsers();
      const ms = u.filter((x) => x.role === "mentor");
      setMentors(ms);
      if (ms[0]) setMentorEmail(ms[0].email);
    })();
  }, []);

  const submit = async () => {
    const p = Number(price.replace(/[^0-9.]/g, ""));
    if (!mentorEmail.trim() || !parentName.trim() || !location.trim() || !p) {
      Alert.alert("Missing", "Mentor, parent name, location, and price are required.");
      return;
    }
    try {
      await createMentorAdminRequest({
        mentorEmail: mentorEmail.trim().toLowerCase(),
        parentName: parentName.trim(),
        parentLocation: location.trim(),
        priceAmount: p,
        currency: "INR",
        notes: notes.trim() || undefined,
      });
      Alert.alert("Sent", "Request appears in Mentor Inbox.");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed");
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1A1D1F" />
        </Pressable>
        <Text style={styles.title}>Send mentor request</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>Mentor</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {mentors.map((m) => (
            <Pressable
              key={m.id}
              style={[styles.chip, mentorEmail === m.email && styles.chipOn]}
              onPress={() => setMentorEmail(m.email)}
            >
              <Text style={[styles.chipText, mentorEmail === m.email && styles.chipTextOn]}>
                {m.fullName}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.hint}>{mentorEmail}</Text>

        <Text style={styles.label}>Parent name</Text>
        <TextInput style={styles.input} value={parentName} onChangeText={setParentName} />

        <Text style={styles.label}>Location</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} />

        <Text style={styles.label}>Price (INR)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
          placeholder="1200"
        />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        <Pressable style={styles.btn} onPress={submit}>
          <Text style={styles.btnText}>Send to mentor inbox</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F6F8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#1A1D1F" },
  scroll: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: "800", color: "#6B7280", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    backgroundColor: "#FFF",
  },
  chips: { marginTop: 8, maxHeight: 44 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    marginRight: 8,
  },
  chipOn: { backgroundColor: "#1A1D1F" },
  chipText: { fontWeight: "700", color: "#374151" },
  chipTextOn: { color: "#FFF" },
  hint: { fontSize: 11, color: "#9CA3AF", marginTop: 4 },
  btn: {
    marginTop: 24,
    backgroundColor: "#3F8CFF",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  btnText: { color: "#FFF", fontWeight: "900" },
});
