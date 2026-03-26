import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AVATAR_OPTIONS, useUser } from "../context/UserContext";
import { updateStoredUser } from "../services/authService";
import { getMentorExtras, setMentorExtras } from "../services/mentorExtras";

const AVATAR_KEY_PREFIX = "parent_avatar_";

export default function MentorUpdateAccountScreen() {
  const { parentName, email, selectedAvatarId, setAvatar, setUser } = useUser();
  const [name, setName] = useState(parentName);
  const [mail, setMail] = useState(email ?? "");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    (async () => {
      if (email) {
        const ex = await getMentorExtras(email);
        setPhone(ex.phone ?? "");
      }
    })();
  }, [email]);

  useEffect(() => {
    setName(parentName);
    setMail(email ?? "");
  }, [parentName, email]);

  const save = async () => {
    if (!email) return;
    try {
      const prevEmail = email;
      const updated = await updateStoredUser(prevEmail, {
        email: mail.trim().toLowerCase(),
        fullName: name.trim(),
        phone: phone.trim(),
      });
      await setMentorExtras(updated.email, { phone: phone.trim() });
      if (prevEmail !== updated.email) {
        const av = await AsyncStorage.getItem(`${AVATAR_KEY_PREFIX}${prevEmail}`);
        if (av != null) {
          await AsyncStorage.setItem(`${AVATAR_KEY_PREFIX}${updated.email}`, av);
        }
      }
      await setUser(updated.email, updated.fullName, "mentor");
      Alert.alert("Saved", "Profile updated.");
      router.back();
    } catch {
      Alert.alert("Error", "Could not save.");
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
          <Text style={styles.title}>Update account</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.label}>Display name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={mail}
            onChangeText={setMail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text style={styles.label}>Contact</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+91 ..."
          />
          <Text style={styles.label}>Avatar</Text>
          <View style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => setAvatar(opt.id)}
                style={[
                  styles.avatarOpt,
                  selectedAvatarId === opt.id && styles.avatarOptOn,
                ]}
              >
                <Image source={opt.source} style={styles.avatarImg} />
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
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
  label: { fontSize: 12, fontWeight: "700", color: "#6B7280", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    backgroundColor: "rgba(255,255,255,0.95)",
    fontSize: 15,
  },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  avatarOpt: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "transparent",
  },
  avatarOptOn: { borderColor: "#8F54FF" },
  avatarImg: { width: "100%", height: "100%" },
  saveBtn: {
    marginTop: 28,
    backgroundColor: "#8F54FF",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  saveText: { color: "#FFF", fontWeight: "900", fontSize: 16 },
});
