import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
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
import { useUser } from "../context/UserContext";

export default function UpdateAccount() {
  const { parentName, email } = useUser();
  const [fullName, setFullName] = useState(parentName ?? "Admin");
  const [gmail, setGmail] = useState(email ?? "");

  const onSave = () => {
    Alert.alert("Saved", "Update Account is wired for UI now. Connect to backend later.");
    router.back();
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1A1D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Account</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account details</Text>
          <Text style={styles.sectionSub}>Edit and save your admin account information.</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput value={fullName} onChangeText={setFullName} style={styles.input} />

          <Text style={styles.label}>Gmail</Text>
          <TextInput
            value={gmail}
            onChangeText={setGmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={onSave}>
            <Feather name="save" size={18} color="#FFF" />
            <Text style={styles.primaryText}>Save</Text>
          </TouchableOpacity>
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
  scroll: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },
  sectionTitle: { fontWeight: "900", color: "#1A1D1F", fontSize: 16 },
  sectionSub: { color: "#6F767E", marginTop: 4 },
  label: { marginTop: 12, fontWeight: "800", color: "#1A1D1F" },
  input: {
    marginTop: 8,
    backgroundColor: "#F4F4F4",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontWeight: "700",
    color: "#1A1D1F",
  },
  primaryBtn: {
    marginTop: 16,
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

