import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useGlobalLoader } from "../context/LoadingOverlayContext";
import { AVATAR_OPTIONS, useUser } from "../context/UserContext";

export default function ParentDashboard() {
  const { show } = useGlobalLoader();
  const { parentName, selectedAvatarId, setAvatar, clearUser } = useUser();
  const currentAvatarSource =
    AVATAR_OPTIONS.find((a) => a.id === selectedAvatarId)?.source ?? AVATAR_OPTIONS[0].source;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);
  
  // State to track if user has booked sessions
  const [hasBookedSession, setHasBookedSession] = useState(false);

  const handleLogout = async () => {
    await clearUser();
    show();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient matching the image */}
      <LinearGradient
        colors={["#FFFFFF", "#DFF4E8", "#D2EEDC"]}
        locations={[0.2, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => setSidebarOpen(true)} hitSlop={10}>
              <Image source={currentAvatarSource} style={styles.avatar} />
            </Pressable>
            <Text style={styles.headerName}>{parentName.toUpperCase()}</Text>
          </View>
          <Pressable hitSlop={10}>
            <MaterialCommunityIcons name="dots-grid" size={28} color="#1F3E3A" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* HERO CARD (Upcoming Session) */}
          <View style={styles.heroCard}>
            <View style={styles.heroLeft}>
              {hasBookedSession ? (
                <>
                  <Text style={styles.heroTitle}>Mathematics{"\n"}Session</Text>
                  <Text style={styles.heroSubtitle}>Anita Sharma</Text>
                  <Text style={styles.heroTime}>2 Hrs</Text>
                </>
              ) : (
                <>
                  <Text style={styles.heroTitle}>Upcoming{"\n"}Session</Text>
                  <Text style={styles.heroSubtitle}>No sessions booked yet</Text>
                  <Text style={styles.heroTime}>Book your first session</Text>
                </>
              )}
            </View>

            {/* The right-side colored block */}
            <View style={styles.heroRightBox}>
              <Ionicons name="calculator" size={48} color="#E86E36" />
              <View style={styles.playButton}>
                <Ionicons name="play" size={16} color="#1F3E3A" />
              </View>
            </View>
          </View>

          {/* QUICK ACTIONS SECTION */}
          <View style={styles.quickActionsWrapper}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
              <Feather name="more-horizontal" size={20} color="#1F3E3A" />
            </View>

            <View style={styles.actionsGrid}>
              {/* 1. Home */}
              <Pressable 
                style={styles.actionButton}
                onPress={() => console.log("Home pressed")}
              >
                <Feather name="home" size={24} color="#78C4A4" />
              </Pressable>

              {/* 2. Booking */}
              <Pressable 
                style={styles.actionButton}
                onPress={() => {
                  show();
                  router.push("/booking");
                }}
              >
                <Feather name="calendar" size={24} color="#78C4A4" />
              </Pressable>

              {/* 3. Live Location */}
              <Pressable 
                style={styles.actionButton}
                onPress={() => {
                  show();
                  router.push("/live-tracking");
                }}
              >
                <Feather name="map-pin" size={24} color="#78C4A4" />
              </Pressable>

              {/* 4. Logout */}
              <Pressable 
                style={styles.actionButton}
                onPress={handleLogout}
              >
                <Feather name="log-out" size={24} color="#E86E36" />
              </Pressable>
            </View>
          </View>

          {/* AVATAR SECTION - Parent can change avatar */}
          <View style={styles.avatarSection}>
            <Text style={styles.sectionTitle}>AVATAR</Text>
            <Text style={styles.avatarSectionSubtitle}>Choose your profile picture</Text>
            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() => setAvatar(option.id)}
                  style={[
                    styles.avatarOption,
                    selectedAvatarId === option.id && styles.avatarOptionSelected,
                  ]}
                >
                  <Image source={option.source} style={styles.avatarOptionImage} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* RECENT ACTIVITY SECTION */}
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>RECENT SESSIONS</Text>
            <View style={styles.divider} />

            {/* List Item 1 */}
            <View style={styles.activityRow}>
              <View style={styles.activityLeft}>
                <Image
                  source={{ uri: "https://i.pravatar.cc/150?img=33" }}
                  style={styles.activityAvatar}
                />
                <View>
                  <Text style={styles.activityName}>Vikram Singh</Text>
                  <Text style={styles.activitySub}>Science, Completed</Text>
                </View>
              </View>
              <Text style={styles.activityScore}>5.0 ⭐</Text>
            </View>

            {/* List Item 2 */}
            <View style={styles.activityRow}>
              <View style={styles.activityLeft}>
                <Image
                  source={{ uri: "https://i.pravatar.cc/150?img=47" }}
                  style={styles.activityAvatar}
                />
                <View>
                  <Text style={styles.activityName}>Priya Sharma</Text>
                  <Text style={styles.activitySub}>English, Cancelled</Text>
                </View>
              </View>
              <Text style={styles.activityScore}>—</Text>
            </View>
          </View>

        </ScrollView>

        {/* SIDEBAR OVERLAY (Redesigned to match image) */}
        {sidebarOpen && (
          <View style={styles.sidebarOverlay}>
            <Pressable
              style={styles.sidebarBackdrop}
              onPress={() => setSidebarOpen(false)}
            />
            
            <View style={styles.sidebar}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarScroll}>
                
                {/* Header */}
                <View style={styles.sidebarHeaderRow}>
                  <Text style={styles.sidebarMainTitle}>Main Menu</Text>
                  <Pressable onPress={() => setSidebarOpen(false)} style={styles.sidebarCloseBtn}>
                    <Feather name="chevron-left" size={24} color="#9CA3AF" />
                  </Pressable>
                </View>

                {/* Verify Email Card */}
                <View style={styles.verifyCard}>
                  <View style={styles.verifyIconWrap}>
                    <Feather name="mail" size={20} color="#000" />
                    <View style={styles.verifyDot} />
                  </View>
                  <Text style={styles.verifyText}>Verify email for{"\n"}safe transactions</Text>
                  <Feather name="chevron-right" size={20} color="#9CA3AF" />
                </View>

                {/* Grid Menu (Synced with Quick Actions) */}
                <View style={styles.sidebarGrid}>
                  <Pressable 
                    style={styles.sidebarGridItem}
                    onPress={() => {
                      console.log("Home pressed");
                      setSidebarOpen(false);
                    }}
                  >
                    <Feather name="home" size={20} color="#FFFFFF"/>
                    <Text style={styles.sidebarGridText}>Home</Text>
                  </Pressable>
                  
                  <Pressable 
                    style={styles.sidebarGridItem}
                    onPress={() => {
                      setSidebarOpen(false);
                      show();
                      router.push("/booking");
                    }}
                  >
                    <Feather name="calendar" size={20} color="#FFFFFF"/>
                    <Text style={styles.sidebarGridText}>Booking</Text>
                  </Pressable>
                  
                  <Pressable 
                    style={styles.sidebarGridItem}
                    onPress={() => {
                      setSidebarOpen(false);
                      show();
                      router.push("/live-tracking");
                    }}
                  >
                    <Feather name="map-pin" size={20} color="#FFFFFF"/>
                    <Text style={styles.sidebarGridText}>Live Loc.</Text>
                  </Pressable>
                  
                  <Pressable 
                    style={styles.sidebarGridItem}
                    onPress={() => {
                      setSidebarOpen(false);
                      handleLogout();
                    }}
                  >
                    <Feather name="log-out" size={20} color="#E86E36"/>
                    <Text style={styles.sidebarGridText}>Logout</Text>
                  </Pressable>
                </View>

                {/* Messages Section */}
                <Text style={styles.sidebarSectionTitle}>Messages</Text>
                
                <Pressable 
                  style={styles.sidebarListItem}
                  onPress={() => {
                    setSidebarOpen(false);
                    router.push("/(tabs)/inbox");
                  }}
                >
                  <Feather name="inbox" size={22} color="#FFFFFF" />
                  <Text style={styles.sidebarListItemText}>Inbox</Text>
                </Pressable>

                <View style={styles.sidebarListItem}>
                  <Feather name="bell" size={22} color="#FFFFFF" />
                  <Text style={styles.sidebarListItemText}>Notifications</Text>
                  <Pressable
                    style={[
                      styles.toggle,
                      notificationsOn && styles.toggleOn,
                    ]}
                    onPress={() => setNotificationsOn((v) => !v)}
                  >
                    <View
                      style={[
                        styles.toggleKnob,
                        notificationsOn && styles.toggleKnobOn,
                      ]}
                    />
                  </Pressable>
                </View>

                {/* Account and Security Section */}
                <Text style={styles.sidebarSectionTitle}>Account and Security</Text>

                <Pressable 
                  style={styles.sidebarListItem}
                  onPress={() => {
                    setSidebarOpen(false);
                    router.push("/(tabs)/account-update");
                  }}
                >
                  <Feather name="user" size={22} color="#FFFFFF" />
                  <Text style={styles.sidebarListItemText}>Update Account Data</Text>
                </Pressable>

                <Pressable style={styles.sidebarListItem}>
                  <Feather name="globe" size={22} color="#FFFFFF" />
                  <Text style={styles.sidebarListItemText}>Language</Text>
                </Pressable>

                <Pressable style={styles.sidebarListItem}>
                  <Feather name="lock" size={22} color="#FFFFFF" />
                  <Text style={styles.sidebarListItemText}>Reset Password</Text>
                </Pressable>

              </ScrollView>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

// ... (Keep the identical styles from the previous code provided here) ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 10,
  },

  // --- HEADER ---
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    marginBottom: 30,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FDE3D1", 
  },
  headerName: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "800",
    color: "#1F3E3A",
    letterSpacing: 1,
  },

  // --- HERO CARD ---
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 30,
  },
  heroLeft: {
    flex: 1,
    justifyContent: "space-between",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F3E3A",
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    fontWeight: "500",
  },
  heroTime: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F3E3A",
    marginTop: 20,
  },
  heroRightBox: {
    width: 110,
    height: 110,
    backgroundColor: "#FDE3D1",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  playButton: {
    position: "absolute",
    width: 32,
    height: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    top: -10,
    right: -10,
  },

  // --- QUICK ACTIONS ---
  quickActionsWrapper: {
    borderWidth: 1,
    borderColor: "rgba(120, 196, 164, 0.3)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1F3E3A",
    letterSpacing: 1.2,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    width: 60,
    height: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#78C4A4",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },

  // --- AVATAR SECTION ---
  avatarSection: {
    marginBottom: 30,
  },
  avatarSectionSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
    marginTop: 4,
    marginBottom: 16,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "transparent",
  },
  avatarOptionSelected: {
    borderColor: "#78C4A4",
  },
  avatarOptionImage: {
    width: "100%",
    height: "100%",
  },

  // --- ACTIVITY SECTION ---
  activitySection: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(120, 196, 164, 0.3)",
    marginVertical: 16,
  },
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E2E8F0",
    marginRight: 16,
  },
  activityName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F3E3A",
    marginBottom: 4,
  },
  activitySub: {
    fontSize: 13,
    color: "#78C4A4",
    fontWeight: "500",
  },
  activityScore: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F3E3A",
  },

  // --- REDESIGNED DARK SIDEBAR ---
  sidebarOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  sidebarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "85%", // Fits perfectly for standard screen sizes
    maxWidth: 340,
    backgroundColor: "#050505", 
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  sidebarScroll: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 60 : 50,
    paddingBottom: 40,
  },
  sidebarHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  sidebarMainTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  sidebarCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1F1F22",
    justifyContent: "center",
    alignItems: "center",
  },
  verifyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F1F22",
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
  },
  verifyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  verifyDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#F5A623",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  verifyText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  sidebarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  sidebarGridItem: {
    width: "48%",
    backgroundColor: "#1F1F22",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sidebarGridText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 10,
  },
  sidebarSectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 20,
    marginTop: 10,
  },
  sidebarListItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  sidebarListItemText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "400",
    marginLeft: 16,
    flex: 1,
  },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#333333",
    padding: 2,
    justifyContent: "center",
  },
  toggleOn: {
    backgroundColor: "#4CD964", // Green to match standard iOS aesthetic in dark mode
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
  },
  toggleKnobOn: {
    alignSelf: "flex-end",
  },
});