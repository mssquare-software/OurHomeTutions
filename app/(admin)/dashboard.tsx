import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AVATAR_OPTIONS, useUser } from "../context/UserContext";
import { listQueries, listUsers } from "../data/repo/repo";
import type { AppUser } from "../data/models";
import { useLanguage } from "../context/LanguageContext";

const QUICK_ACTIONS_STORAGE_KEY = "admin_quick_actions";
const MAX_QUICK_ACTIONS = 5;

type QuickActionId = "home" | "activeJobs" | "activeBooking" | "applications" | "queries";

const QUICK_ACTION_CONFIG: Record<QuickActionId, { label: string; icon: string; route: string }> = {
  home: { label: "common.home", icon: "home", route: "/(admin)/dashboard" },
  activeJobs: { label: "sidebar.postJob", icon: "briefcase", route: "/(admin)/jobs" },
  activeBooking: { label: "sidebar.bookings", icon: "calendar", route: "/(admin)/bookings" },
  applications: { label: "Applications", icon: "file-text", route: "/(admin)/applications" },
  queries: { label: "sidebar.queries", icon: "help-circle", route: "/(admin)/queries" },
};

const DEFAULT_QUICK_ACTIONS: QuickActionId[] = ["home", "activeJobs", "activeBooking"];

export default function AdminDashboard() {
  const { parentName, selectedAvatarId, clearUser } = useUser();
  const { t } = useLanguage();
  const currentAvatarSource =
    AVATAR_OPTIONS.find((a) => a.id === selectedAvatarId)?.source ?? AVATAR_OPTIONS[0].source;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [quickActions, setQuickActions] = useState<QuickActionId[]>(DEFAULT_QUICK_ACTIONS);
  const [editQuickActions, setEditQuickActions] = useState(false);
  const [mentors, setMentors] = useState<AppUser[]>([]);
  const [unsolvedQueryCount, setUnsolvedQueryCount] = useState(0);

  const loadQuickActions = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(QUICK_ACTIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as QuickActionId[];
        if (Array.isArray(parsed) && parsed.length <= MAX_QUICK_ACTIONS) {
          setQuickActions(parsed);
        }
      }
    } catch { /* Default handles it */ }
  }, []);

  useEffect(() => { loadQuickActions(); }, [loadQuickActions]);

  useEffect(() => {
    (async () => {
      try {
        const users = await listUsers();
        const ms = users.filter((u) => u.role === "mentor");
        setMentors(ms);
      } catch {
        setMentors([]);
      }
    })();
  }, []);

  useEffect(() => {
    let mounted = true;
    const refreshQueries = async () => {
      try {
        const queries = await listQueries();
        const count = queries.filter((q) => q.status === "unsolved").length;
        if (mounted) setUnsolvedQueryCount(count);
      } catch {
        if (mounted) setUnsolvedQueryCount(0);
      }
    };

    refreshQueries();
    const id = setInterval(refreshQueries, 2500);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const todaysActiveMentors = mentors
    .filter((m) => m.isActive !== false)
    .slice(0, 6);

  const saveQuickActions = async (actions: QuickActionId[]) => {
    setQuickActions(actions);
    await AsyncStorage.setItem(QUICK_ACTIONS_STORAGE_KEY, JSON.stringify(actions));
  };

  const addQuickAction = (id: QuickActionId) => {
    if (quickActions.includes(id) || quickActions.length >= MAX_QUICK_ACTIONS) return;
    saveQuickActions([...quickActions, id]);
  };

  const removeQuickAction = (id: QuickActionId) => {
    saveQuickActions(quickActions.filter((a) => a !== id));
  };

  const handleLogout = async () => {
    await clearUser();
    router.replace("/(auth)/login");
  };

  const navigate = (route: string) => {
    setSidebarOpen(false);
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable onPress={() => setSidebarOpen(true)}>
          <Image source={currentAvatarSource} style={styles.avatar} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("common.overview")}</Text>
        <TouchableOpacity onPress={() => setSidebarOpen(true)}>
          <Feather name="grid" size={24} color="#1A1D1F" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Summary Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#3F8CFF' }]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>{t("stats.revenue")}</Text>
              <Feather name="trending-up" size={14} color="white" />
            </View>
            <Text style={styles.statValue}>₹ 67,350</Text>
            <Text style={styles.statSubValue}>Total Earnings</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#1A1D1F' }]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>{t("stats.today")}</Text>
              <Feather name="calendar" size={14} color="white" />
            </View>
            <Text style={styles.statValue}>₹ 2,584</Text>
            <Text style={styles.statSubValue}>Daily Goal: 80%</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FF6A55' }]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>{t("stats.avgSession")}</Text>
              <Feather name="clock" size={14} color="white" />
            </View>
            <Text style={styles.statValue}>2.3 hrs</Text>
            <Text style={styles.statSubValue}>+15% vs Last Week</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: '#8E59FF' }]}
            onPress={() => router.push("/(admin)/bookings")}
          >
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>{t("sidebar.bookings")}</Text>
              <Feather name="check-circle" size={14} color="white" />
            </View>
            <Text style={styles.statValue}>{t("common.active")}</Text>
            <Text style={styles.statSubValue}>Green dot live</Text>
          </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: "#0B1220" }]}
              onPress={() => router.push("/(admin)/queries")}
            >
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>{t("sidebar.queries")}</Text>
                <Feather name="help-circle" size={14} color="white" />
              </View>
              <Text style={styles.statValue}>{unsolvedQueryCount}</Text>
              <Text style={styles.statSubValue}>{t("common.unsolved")}</Text>
            </TouchableOpacity>
        </View>

        {/* Quick Actions Management */}
        <View style={styles.whiteSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("dashboard.quickActions")}</Text>
            <TouchableOpacity onPress={() => setEditQuickActions(!editQuickActions)}>
              <Feather name={editQuickActions ? "check" : "edit-2"} size={18} color="#6F767E" />
            </TouchableOpacity>
          </View>

          <View style={styles.quickActionsRow}>
            {quickActions.map((id) => {
              const config = QUICK_ACTION_CONFIG[id];
              return (
                <View key={id} style={styles.actionItem}>
                  <TouchableOpacity 
                    style={styles.actionCircle} 
                    onPress={() => router.push(config.route as any)}
                  >
                    <Feather name={config.icon as any} size={22} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={styles.actionLabel} numberOfLines={1}>
                    {config.label.startsWith("common.") || config.label.startsWith("sidebar.")
                      ? t(config.label as any)
                      : config.label}
                  </Text>
                  {editQuickActions && (
                    <TouchableOpacity style={styles.removeBadge} onPress={() => removeQuickAction(id)}>
                      <Feather name="x" size={12} color="#FFF" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
            {quickActions.length < MAX_QUICK_ACTIONS && (
              <TouchableOpacity style={styles.addCircle} onPress={() => setEditQuickActions(true)}>
                <Feather name="plus" size={24} color="#6F767E" />
              </TouchableOpacity>
            )}
          </View>

          {editQuickActions && (
            <View style={styles.chipRow}>
              {(Object.keys(QUICK_ACTION_CONFIG) as QuickActionId[]).map(id => (
                !quickActions.includes(id) && (
                  <TouchableOpacity key={id} style={styles.chip} onPress={() => addQuickAction(id)}>
                    <Text style={styles.chipText}>+ {QUICK_ACTION_CONFIG[id].label}</Text>
                  </TouchableOpacity>
                )
              ))}
            </View>
          )}
        </View>

        {/* Today's Active Mentors */}
        <View style={styles.whiteSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("dashboard.todaysActiveMentors")}</Text>
            <TouchableOpacity onPress={() => navigate("/(admin)/booking-management")}>
              <Text style={styles.seeAllText}>{t("common.assign")}</Text>
            </TouchableOpacity>
          </View>

          {todaysActiveMentors.length === 0 ? (
            <Text style={styles.emptyMentorsText}>No active mentors found.</Text>
          ) : (
            <View style={styles.mentorList}>
              {todaysActiveMentors.map((m) => (
                <View key={m.id} style={styles.mentorRow}>
                  <View style={styles.greenDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mentorName}>{m.fullName}</Text>
                    <Text style={styles.mentorEmail}>{m.email}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.assignMiniBtn}
                    onPress={() => navigate("/(admin)/booking-management")}
                  >
                    <Text style={styles.assignMiniBtnText}>Assign</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sidebar Navigation */}
      {sidebarOpen && (
        <View style={styles.sidebarOverlay}>
          <Pressable style={styles.sidebarBackdrop} onPress={() => setSidebarOpen(false)} />
          <View style={styles.sidebar}>
            <ScrollView contentContainerStyle={styles.sidebarScroll}>
              <View style={styles.sidebarHeader}>
                <Text style={styles.sidebarTitle}>Menu</Text>
                <TouchableOpacity onPress={() => setSidebarOpen(false)}>
                  <Feather name="x" size={24} color="#1A1D1F" />
                </TouchableOpacity>
              </View>

              <View style={styles.sidebarGrid}>
                <TouchableOpacity style={styles.gridItem} onPress={() => navigate("/(admin)/dashboard")}>
                  <Feather name="home" size={20} color="#1A1D1F" />
                  <Text style={styles.gridText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.gridItem} onPress={() => navigate("/(admin)/bookings")}>
                  <Feather name="calendar" size={20} color="#1A1D1F" />
                  <Text style={styles.gridText}>Booking</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.gridItem} onPress={handleLogout}>
                  <Feather name="log-out" size={20} color="#FF6A55" />
                  <Text style={[styles.gridText, { color: '#FF6A55' }]}>Logout</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sidebarSectionLabel}>Admin Settings</Text>
              <TouchableOpacity style={styles.listItem} onPress={() => navigate("/(admin)/queries")}>
                <Feather name="help-circle" size={20} color="#1A1D1F" />
                <Text style={styles.listText}>{t("sidebar.queries")}</Text>
                <Feather name="chevron-right" size={16} color="#6F767E" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.listItem} onPress={() => navigate("/(admin)/bookings")}>
                <Feather name="calendar" size={20} color="#1A1D1F" />
                <Text style={styles.listText}>{t("sidebar.bookings")}</Text>
                <Feather name="chevron-right" size={16} color="#6F767E" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.listItem} onPress={() => navigate("/(admin)/booking-management")}>
                <Feather name="user-check" size={20} color="#1A1D1F" />
                <Text style={styles.listText}>{t("sidebar.bookingManagement")}</Text>
                <Feather name="chevron-right" size={16} color="#6F767E" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.listItem} onPress={() => navigate("/(admin)/mentors")}>
                <Feather name="users" size={20} color="#1A1D1F" />
                <Text style={styles.listText}>{t("sidebar.mentors")}</Text>
                <Feather name="chevron-right" size={16} color="#6F767E" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.listItem} onPress={() => navigate("/(admin)/hr-review")}>
                <Feather name="file-text" size={20} color="#1A1D1F" />
                <Text style={styles.listText}>{t("sidebar.hrReview")}</Text>
                <Feather name="chevron-right" size={16} color="#6F767E" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.listItem} onPress={() => navigate("/(admin)/post-job")}>
                <Feather name="plus-square" size={20} color="#1A1D1F" />
                <Text style={styles.listText}>{t("sidebar.postJob")}</Text>
                <Feather name="chevron-right" size={16} color="#6F767E" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.listItem} onPress={() => navigate("/(admin)/subjects")}>
                <Feather name="book-open" size={20} color="#1A1D1F" />
                <Text style={styles.listText}>{t("sidebar.subjects")}</Text>
                <Feather name="chevron-right" size={16} color="#6F767E" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.listItem} onPress={() => navigate("/(admin)/update-account")}>
                <Feather name="settings" size={20} color="#1A1D1F" />
                <Text style={styles.listText}>{t("sidebar.updateAccount")}</Text>
                <Feather name="chevron-right" size={16} color="#6F767E" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.listItem} onPress={() => navigate("/language")}>
                <Feather name="globe" size={20} color="#1A1D1F" />
                <Text style={styles.listText}>{t("sidebar.language")}</Text>
                <Feather name="chevron-right" size={16} color="#6F767E" />
              </TouchableOpacity>
              
              <View style={styles.listItem}>
                <Feather name="bell" size={20} color="#1A1D1F" />
                <Text style={styles.listText}>{t("sidebar.notifications")}</Text>
                <Switch value={notificationsOn} onValueChange={setNotificationsOn} />
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F6F8" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF'
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1D1F" },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFEFEF' },
  scrollContent: { padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statCard: {
    width: '48%',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  statValue: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  statSubValue: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 },
  
  whiteSection: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1D1F' },
  
  quickActionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  actionItem: { alignItems: 'center', position: 'relative' },
  actionCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#3F8CFF', justifyContent: 'center', alignItems: 'center' },
  actionLabel: { color: '#6F767E', fontSize: 11, marginTop: 8, fontWeight: '500' },
  addCircle: { width: 56, height: 56, borderRadius: 28, borderStyle: 'dashed', borderWidth: 2, borderColor: '#EFEFEF', justifyContent: 'center', alignItems: 'center' },
  removeBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#FF6A55', borderRadius: 10, padding: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#F5F6F8', borderRadius: 12 },
  chipText: { fontSize: 12, color: '#1A1D1F', fontWeight: '600' },

  seeAllText: { color: "#3F8CFF", fontWeight: "800" },
  emptyMentorsText: { color: "#6F767E", fontWeight: "700" },
  mentorList: { gap: 10 },
  mentorRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F6F8" },
  greenDot: { width: 10, height: 10, borderRadius: 10, backgroundColor: "#22C55E" },
  mentorName: { color: "#1A1D1F", fontWeight: "800" },
  mentorEmail: { color: "#6F767E", marginTop: 2, fontSize: 12, fontWeight: "600" },
  assignMiniBtn: { backgroundColor: "#1A1D1F", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  assignMiniBtnText: { color: "#FFFFFF", fontWeight: "900", fontSize: 12 },

  sidebarOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 1000 },
  sidebarBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: "80%", backgroundColor: "#FFF", borderTopRightRadius: 32, borderBottomRightRadius: 32 },
  sidebarScroll: { padding: 24, paddingTop: Platform.OS === "android" ? 60 : 40 },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  sidebarTitle: { fontSize: 24, fontWeight: '700', color: '#1A1D1F' },
  sidebarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
  gridItem: { width: '47%', backgroundColor: '#F5F6F8', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  gridText: { marginLeft: 10, fontSize: 13, fontWeight: '600', color: '#1A1D1F' },
  sidebarSectionLabel: { fontSize: 14, color: '#9A9FA5', fontWeight: '600', marginBottom: 16 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F6F8' },
  listText: { flex: 1, marginLeft: 16, fontSize: 15, color: '#1A1D1F', fontWeight: '500' }
});