import { Feather } from "@expo/vector-icons";
import React from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useLanguage, type AppLanguage } from "./context/LanguageContext";

const OPTIONS: { lang: AppLanguage; labelKey: any }[] = [
  { lang: "en", labelKey: "language.english" },
  { lang: "hi", labelKey: "language.hindi" },
  { lang: "te", labelKey: "language.telugu" },
];

export default function LanguageScreen() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1A1D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("language.title")}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.card}>
        {OPTIONS.map((o) => {
          const active = language === o.lang;
          return (
            <TouchableOpacity
              key={o.lang}
              style={[styles.row, active && styles.rowActive]}
              onPress={async () => {
                await setLanguage(o.lang);
                router.back();
              }}
            >
              <Text style={[styles.rowText, active && styles.rowTextActive]}>
                {t(o.labelKey)}
              </Text>
              {active && (
                <View style={styles.check}>
                  <Feather name="check" size={14} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
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
  card: {
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E6E8EC",
    gap: 10,
  },
  row: {
    backgroundColor: "#F4F4F4",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowActive: { backgroundColor: "#3F8CFF" },
  rowText: { fontWeight: "900", color: "#1A1D1F" },
  rowTextActive: { color: "#FFFFFF" },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
});

