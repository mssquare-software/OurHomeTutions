import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import type { QueryStatus, SupportQuery } from "../data/models";
import { listQueries, updateQueryStatus } from "../data/repo/repo";
import * as Linking from "expo-linking";
import { useLanguage } from "../context/LanguageContext";

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString();
}

export default function AdminQueries() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<QueryStatus>("unsolved");
  const [all, setAll] = useState<SupportQuery[]>([]);
  const [fromTs, setFromTs] = useState<number>(() => startOfDay(Date.now() - 1000 * 60 * 60 * 24 * 7));
  const [toTs, setToTs] = useState<number>(() => endOfDay(Date.now()));

  const refresh = async () => {
    const data = await listQueries();
    setAll(data);
  };

  useEffect(() => {
    refresh();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [])
  );

  useEffect(() => {
    const id = setInterval(() => {
      refresh();
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    return all
      .filter((q) => q.status === tab)
      .filter((q) => q.createdAt >= fromTs && q.createdAt <= toTs)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [all, tab, fromTs, toTs]);

  const shiftRange = (days: number) => {
    const nextFrom = startOfDay(fromTs + days * 24 * 60 * 60 * 1000);
    const nextTo = endOfDay(toTs + days * 24 * 60 * 60 * 1000);
    setFromTs(nextFrom);
    setToTs(nextTo);
  };

  const markSolved = async (id: string) => {
    await updateQueryStatus(id, "solved");
    await refresh();
  };

  const markUnsolved = async (id: string) => {
    await updateQueryStatus(id, "unsolved");
    await refresh();
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1A1D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("queries.title")}</Text>
        <TouchableOpacity onPress={refresh}>
          <Feather name="refresh-cw" size={20} color="#1A1D1F" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {(["unsolved", "solved"] as const).map((tabId) => (
          <Pressable
            key={tabId}
            onPress={() => setTab(tabId)}
            style={[styles.tab, tab === tabId && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === tabId && styles.tabTextActive]}>
              {tabId === "unsolved" ? t("queries.unsolved") : t("queries.solved")}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.filterCard}>
        <View style={styles.filterTop}>
          <Text style={styles.filterLabel}>{t("queries.dateRange")}</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity style={styles.rangeBtn} onPress={() => shiftRange(-7)}>
              <Feather name="chevron-left" size={16} color="#6F767E" />
              <Text style={styles.rangeBtnText}>Prev 7d</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rangeBtn} onPress={() => shiftRange(7)}>
              <Text style={styles.rangeBtnText}>Next 7d</Text>
              <Feather name="chevron-right" size={16} color="#6F767E" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.rangeRow}>
          <View style={styles.rangePill}>
            <Text style={styles.rangePillLabel}>{t("queries.from")}</Text>
            <Text style={styles.rangePillValue}>{formatDate(fromTs)}</Text>
          </View>
          <View style={styles.rangePill}>
            <Text style={styles.rangePillLabel}>{t("queries.to")}</Text>
            <Text style={styles.rangePillValue}>{formatDate(toTs)}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={34} color="#6F767E" />
            <Text style={styles.emptyTitle}>{t("queries.noQueries")}</Text>
            <Text style={styles.emptySub}>{t("queries.tryChange")}</Text>
          </View>
        ) : (
          filtered.map((q) => (
            <View key={q.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatarDot} />
                <View style={styles.cardMeta}>
                  <Text style={styles.cardName}>{q.fromName}</Text>
                  <Text style={styles.cardSub}>
                    {q.fromEmail} • {new Date(q.createdAt).toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.statusPill, tab === "unsolved" ? styles.statusUnsolved : styles.statusSolved]}>
                  <Text style={styles.statusText}>
                    {tab === "unsolved" ? t("queries.unsolved") : t("queries.solved")}
                  </Text>
                </View>
              </View>

              <View style={styles.subjectRow}>
                <Feather name="tag" size={14} color="#6F767E" />
                <Text style={styles.subjectText}>{q.subject || "General"}</Text>
              </View>

              <Text style={styles.message}>{q.message}</Text>

              {(q.attachments?.length ?? 0) > 0 && (
                <View style={styles.attachmentsRow}>
                  {q.attachments?.slice(0, 3).map((a) => (
                    <TouchableOpacity
                      key={a.id}
                      style={styles.attachmentChip}
                      onPress={() => Linking.openURL(a.uri)}
                    >
                      <Feather name={a.type === "image" ? "image" : "file"} size={14} color="#1A1D1F" />
                      <Text style={styles.attachmentText} numberOfLines={1}>{a.name}</Text>
                    </TouchableOpacity>
                  ))}
                  {(q.attachments?.length ?? 0) > 3 && (
                    <Text style={styles.moreText}>+{(q.attachments?.length ?? 0) - 3} more</Text>
                  )}
                </View>
              )}

              <View style={styles.actionsRow}>
                {tab === "unsolved" ? (
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => markSolved(q.id)}>
                    <Feather name="check-circle" size={16} color="#FFF" />
                    <Text style={styles.primaryBtnText}>{t("queries.markSolved")}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => markUnsolved(q.id)}>
                    <Feather name="rotate-ccw" size={16} color="#1A1D1F" />
                    <Text style={styles.secondaryBtnText}>{t("queries.moveToUnsolved")}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.ghostBtn}
                  onPress={() => router.push({ pathname: "/(admin)/dashboard" } as any)}
                >
                  <Feather name="external-link" size={16} color="#6F767E" />
                </TouchableOpacity>
              </View>
            </View>
          ))
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
  tabRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10 },
  tab: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },
  tabActive: { backgroundColor: "#3F8CFF", borderColor: "#3F8CFF" },
  tabText: { fontWeight: "700", color: "#6F767E" },
  tabTextActive: { color: "#FFFFFF" },

  filterCard: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },
  filterTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  filterLabel: { fontWeight: "800", color: "#1A1D1F" },
  filterButtons: { flexDirection: "row", gap: 10 },
  rangeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#F4F4F4",
    borderRadius: 12,
  },
  rangeBtnText: { fontWeight: "700", color: "#6F767E", fontSize: 12 },
  rangeRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  rangePill: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#0B1220",
    padding: 12,
  },
  rangePillLabel: { color: "#9AA0A6", fontWeight: "700", fontSize: 12 },
  rangePillValue: { color: "#FFFFFF", fontWeight: "800", marginTop: 4 },

  scroll: { padding: 16, paddingBottom: 30, gap: 12 },
  empty: {
    paddingTop: 80,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#1A1D1F", marginTop: 8 },
  emptySub: { color: "#6F767E", textAlign: "center", paddingHorizontal: 26 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarDot: { width: 10, height: 10, borderRadius: 10, backgroundColor: "#3F8CFF" },
  cardMeta: { flex: 1 },
  cardName: { fontWeight: "900", color: "#1A1D1F" },
  cardSub: { color: "#6F767E", marginTop: 2, fontSize: 12 },
  subjectRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  subjectText: { color: "#1A1D1F", fontWeight: "800" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusUnsolved: { backgroundColor: "rgba(255,106,85,0.15)" },
  statusSolved: { backgroundColor: "rgba(63,140,255,0.15)" },
  statusText: { fontWeight: "800", color: "#1A1D1F", fontSize: 12 },
  message: { marginTop: 12, color: "#1A1D1F", lineHeight: 20 },
  attachmentsRow: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  attachmentChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#F4F4F4", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8, maxWidth: "80%" },
  attachmentText: { fontWeight: "800", color: "#1A1D1F", maxWidth: 180 },
  moreText: { color: "#6F767E", fontWeight: "800" },
  actionsRow: { marginTop: 12, flexDirection: "row", gap: 10, alignItems: "center" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#3F8CFF",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "900" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F4F4F4",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  secondaryBtnText: { color: "#1A1D1F", fontWeight: "900" },
  ghostBtn: {
    marginLeft: "auto",
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F4F4",
  },
});

