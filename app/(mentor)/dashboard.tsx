import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { AVATAR_OPTIONS, useUser } from "../context/UserContext";
import { useNotifications } from "../hooks/useNotifications";

const { width, height } = Dimensions.get("window");

export default function MentorDashboard() {
  const { parentName, email, selectedAvatarId, clearUser } = useUser();
  const { getBookingsForMentor, bookings: ctxBookings } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completionProgress, setCompletionProgress] = useState(0);

  const currentAvatar =
    AVATAR_OPTIONS.find((a) => a.id === selectedAvatarId)?.source ?? AVATAR_OPTIONS[0].source;

  const myBookings = email ? getBookingsForMentor(email) : [];

  useEffect(() => {
    if (!email) {
      setCompletionProgress(0);
      return;
    }
    const list = getBookingsForMentor(email);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todaySessions = list.filter(
      (b) =>
        b.date === todayStr &&
        ["assigned", "accepted", "in_progress", "confirmed", "completed"].includes(
          b.status
        )
    );
    const done = todaySessions.filter((b) => b.status === "completed");
    const pct =
      todaySessions.length === 0
        ? 0
        : Math.round((done.length / todaySessions.length) * 100);
    setCompletionProgress(pct);
  }, [email, ctxBookings, getBookingsForMentor]);

  const handleLogout = async () => {
    await clearUser();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Dashboard Header */}
          <View style={styles.header}>
            <Pressable onPress={() => setSidebarOpen(true)}>
              <Image source={currentAvatar} style={styles.topAvatar} />
            </Pressable>
            <View style={styles.headerRight}>
              <Pressable style={styles.iconBtn}><Ionicons name="notifications-outline" size={22} color="#1A1D1F" /></Pressable>
              <Pressable style={styles.iconBtn}><Feather name="shopping-bag" size={22} color="#1A1D1F" /></Pressable>
            </View>
          </View>

          <Text style={styles.welcomeText}>Hello, {parentName.split(" ")[0]}</Text>
          <Text style={styles.dateSubtext}>22 March, <Text style={{ color: '#E09C5F', fontWeight: '700' }}>Upcoming Sessions</Text></Text>

          {/* Progress Section */}
          <View style={styles.progressContainer}>
            <View style={styles.outerCircle}>
              <View style={styles.innerCircle}>
                <Text style={styles.progressPercent}>{completionProgress}%</Text>
                <Text style={styles.progressLabel}>Completed</Text>
              </View>
              {[...Array(40)].map((_, i) => (
                <View key={i} style={[styles.tick, { transform: [{ rotate: `${i * 9}deg` }, { translateY: -105 }], backgroundColor: i < (completionProgress / 2.5) ? '#7F3DFF' : '#E2E8F0' }]} />
              ))}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionRow}>
            <ActionItem icon="briefcase" label="Jobs" color="#7F3DFF" bg="#F5F3FF" path="/(mentor)/applications" />
            <ActionItem icon="calendar" label="Sessions" color="#0EA5E9" bg="#F0F9FF" path="/(mentor)/session-bookings" />
            <ActionItem icon="message-circle" label="Inbox" color="#6366F1" bg="#EEF2FF" path="/(mentor)/inbox" />
            <ActionItem icon="award" label="Badges" color="#10B981" bg="#ECFDF5" path="/(mentor)/badges" />
          </View>

          {/* Timeline */}
          <Text style={styles.sectionTitle}>Learning Timeline</Text>
          <View style={styles.timelineContainer}>
            {myBookings.length === 0 ? (
              <Text style={{ color: "#94A3B8", fontWeight: "600" }}>
                No sessions yet — check Sessions when admin assigns you.
              </Text>
            ) : (
              myBookings.slice(0, 12).map((item) => (
                <View key={item.id} style={styles.timelineCard}>
                  <View style={styles.timelineTimeContainer}>
                    <Text style={styles.timelineTimeText}>{item.time}</Text>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineLine} />
                  </View>
                  <LinearGradient colors={["#7F3DFF", "#9662FF"]} style={styles.sessionCard}>
                    <Text style={styles.sessionTitle}>{item.subject}</Text>
                    <Text style={styles.sessionSubtitle}>
                      {item.parentName} • {item.status} • {item.hours}h
                    </Text>
                  </LinearGradient>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* NEW SIDEBAR MODAL - MATCHING SCREENSHOT */}
      <Modal visible={sidebarOpen} animationType="fade" transparent>
        <View style={styles.sideOverlay}>
          <Pressable style={styles.sideBackdrop} onPress={() => setSidebarOpen(false)} />
          <View style={styles.sideMenu}>
            <SafeAreaView style={{ flex: 1 }}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sideScrollContent}>
                
                {/* Profile Header */}
                <View style={styles.sideProfileHeader}>
                  <Image source={currentAvatar} style={styles.sideAvatarLarge} />
                  <Text style={styles.sideName}>{parentName || "Bardia Adibi"}</Text>
                  <Text style={styles.sideEmail}>{email || "bardiaadb@gmail.com"}</Text>
                </View>

                <View style={styles.sideDivider} />

                {/* Navigation Items */}
                <View style={styles.sideNavSection}>
                  <SidebarItem icon="check-circle" title="Learn and earn" showChevron={false} onPress={() => {}} />
                  <SidebarItem icon="users" title="Invite friends" showChevron={false} onPress={() => {}} />
                  <SidebarItem icon="gift" title="Send a gift" tag="$10" showChevron={false} onPress={() => {}} />
                  
                  <View style={{ height: 20 }} />

                  <SidebarItem icon="briefcase" title="Applications" subtitle="View job openings" onPress={() => { setSidebarOpen(false); router.push("/(mentor)/applications"); }} />
                  <SidebarItem icon="calendar" title="Sessions & attendance" subtitle="Accept bookings & codes" onPress={() => { setSidebarOpen(false); router.push("/(mentor)/session-bookings"); }} />
                  <SidebarItem icon="user" title="Update account" subtitle="Profile & Contact" onPress={() => { setSidebarOpen(false); router.push("/(mentor)/update-account"); }} />
                  <SidebarItem icon="inbox" title="Inbox" subtitle="Messages & Requests" onPress={() => { setSidebarOpen(false); router.push("/(mentor)/inbox"); }} />
                  <SidebarItem icon="list" title="Requests" subtitle="Track your status" onPress={() => { setSidebarOpen(false); router.push("/(mentor)/requests"); }} />
                  <SidebarItem icon="award" title="Mentor badges" subtitle="View achievements" onPress={() => { setSidebarOpen(false); router.push("/(mentor)/badges"); }} />
                  <SidebarItem icon="globe" title="Language" subtitle="Change app language" onPress={() => { setSidebarOpen(false); router.push("/language"); }} />
                </View>

                {/* Sign Out - Matching the "Sing out" typo/button from screenshot */}
                <Pressable style={styles.sideSignOutBtn} onPress={handleLogout}>
                  <Text style={styles.sideSignOutText}>Sing out</Text>
                </Pressable>

              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const ActionItem = ({ icon, label, color, bg, path }: any) => (
  <Pressable style={styles.actionItem} onPress={() => path && router.push(path)}>
    <View style={[styles.actionIcon, { backgroundColor: bg }]}><Feather name={icon} size={22} color={color} /></View>
    <Text style={styles.actionLabel}>{label}</Text>
  </Pressable>
);

const SidebarItem = ({ icon, title, subtitle, onPress, tag, showChevron = true }: any) => (
  <Pressable style={styles.sideItemPress} onPress={onPress}>
    <View style={styles.sideItemRow}>
      <Feather name={icon} size={20} color="#1A1D1F" style={{ width: 24 }} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.sideItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.sideItemSub}>{subtitle}</Text>}
      </View>
      {tag && <View style={styles.sideTag}><Text style={styles.sideTagText}>{tag}</Text></View>}
      {showChevron && <Feather name="chevron-right" size={16} color="#CBD5E1" />}
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  topAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8FAFC' },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  welcomeText: { fontSize: 32, fontWeight: '800', marginTop: 24, color: '#1A1D1F' },
  dateSubtext: { fontSize: 16, color: '#94A3B8', marginTop: 6 },
  progressContainer: { alignItems: 'center', marginVertical: 32 },
  outerCircle: { width: 220, height: 220, borderRadius: 110, alignItems: 'center', justifyContent: 'center' },
  innerCircle: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#FFF', elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, alignItems: 'center', justifyContent: 'center' },
  progressPercent: { fontSize: 48, fontWeight: '900', color: '#1A1D1F' },
  progressLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' },
  tick: { position: 'absolute', width: 2.5, height: 12, borderRadius: 2 },
  quickActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  actionItem: { alignItems: 'center', width: (width - 56) / 4.1 },
  actionIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 14, fontWeight: '700', color: '#1A1D1F' },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#1A1D1F', marginBottom: 20 },
  timelineContainer: { paddingLeft: 4 },
  timelineCard: { flexDirection: 'row', marginBottom: 20 },
  timelineTimeContainer: { width: 65 },
  timelineTimeText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#7F3DFF', marginTop: 6, borderWidth: 2, borderColor: '#FFF' },
  timelineLine: { position: 'absolute', left: 4.5, top: 16, bottom: -24, width: 1, backgroundColor: '#F1F5F9' },
  sessionCard: { flex: 1, marginLeft: 16, borderRadius: 24, padding: 20 },
  sessionTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  sessionSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },

  // SIDEBAR STYLES (MATCHING SCREENSHOT)
  sideOverlay: { flex: 1, flexDirection: 'row', zIndex: 9999 },
  sideBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sideMenu: { width: width * 0.82, backgroundColor: '#FFF', height: '100%', borderTopRightRadius: 32, borderBottomRightRadius: 32 },
  sideScrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  sideProfileHeader: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  sideAvatarLarge: { width: 100, height: 100, borderRadius: 50, marginBottom: 16, backgroundColor: '#F1F5F9' },
  sideName: { fontSize: 24, fontWeight: '800', color: '#1A1D1F' },
  sideEmail: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  sideDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 24 },
  sideNavSection: { marginBottom: 32 },
  sideItemPress: { paddingVertical: 12 },
  sideItemRow: { flexDirection: 'row', alignItems: 'center' },
  sideItemTitle: { fontSize: 16, fontWeight: '700', color: '#1A1D1F' },
  sideItemSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  sideTag: { backgroundColor: '#FEF9C3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  sideTagText: { fontSize: 12, fontWeight: '800', color: '#854D0E' },
  sideSignOutBtn: { backgroundColor: '#F1F5F9', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  sideSignOutText: { fontSize: 16, fontWeight: '800', color: '#1A1D1F' },
});