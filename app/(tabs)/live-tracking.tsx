import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

const PAL = {
  PRIMARY_NAVY: "#1B2A5A",
  DARK_SLATE: "#0F172A",
  SUNSET_ORANGE: "#ffb76c",
  CORAL: "#FF7F50",
  PURE_WHITE: "#FFFFFF",
  SOFT_GRAY: "#F4F6F8",
  BOARDING_BG_TOP: "#1C335A",
  BOARDING_BG_BOT: "#0B162C",
  ACCENT_BLUE: "#93C5FD",
  ROUTE_BLUE: "#3B82F6", 
  SUCCESS_GREEN: "#2E7D32", 
};

// --- Animated Star Component ---
const AnimatedStar = () => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.3,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.Text
      style={{
        fontSize: 14,
        transform: [{ scale: scaleValue }],
        textShadowColor: "#FDE047",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
      }}
    >
      ⭐
    </Animated.Text>
  );
};

// --- Fake Barcode Generator ---
const BarcodeGraphic = () => {
  const bars = Array.from({ length: 45 }).map((_, i) => {
    const width = Math.random() > 0.5 ? 2 : Math.random() > 0.8 ? 4 : 1;
    return (
      <View
        key={i}
        style={{ width, height: 50, backgroundColor: "#000", marginRight: 2 }}
      />
    );
  });
  return <View style={styles.barcodeContainer}>{bars}</View>;
};

export default function BookingConfirmation() {
  const route = router as any;
  const bookingId = route.params?.bookingId || "";

  const [confirmationCode, setConfirmationCode] = useState<string>("");
  const [bookingStatus, setBookingStatus] = useState<"pending" | "accepted">("pending");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Map Expansion State
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Destination Location (Student's Home)
  const destinationLocation = { latitude: 28.6180, longitude: 77.2145 };

  // Mentor's Live Location
  const [teacherLocation, setTeacherLocation] = useState({
    name: "Anita Sharma",
    rating: 4.8,
    age: 28,
    id: "M-8492",
    latitude: 28.6110,
    longitude: 77.2050,
    eta: 15, // minutes
  });
  
  const [showCode, setShowCode] = useState(false);
  
  // Messaging Modal State
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  const QUICK_MESSAGES = [
    "Where are you?",
    "Have you reached?",
    "Please share your live location.",
    "I am waiting outside.",
  ];

  useEffect(() => {
    // Generate Code
    const code = Math.random().toString(36).substr(2, 8).toUpperCase();
    setConfirmationCode(code);

    // Auto-accept after 3 seconds for demo purposes
    setTimeout(() => {
      setBookingStatus("accepted");
    }, 3000);

    // Update Clock Every Second
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Simulate mentor moving towards destination
    const locationInterval = setInterval(() => {
      setTeacherLocation((prev) => {
        const latDiff = destinationLocation.latitude - prev.latitude;
        const lngDiff = destinationLocation.longitude - prev.longitude;
        
        return {
          ...prev,
          latitude: prev.latitude + latDiff * 0.1,
          longitude: prev.longitude + lngDiff * 0.1,
          eta: Math.max(1, prev.eta - 1),
        };
      });
    }, 5000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(locationInterval);
    };
  }, []);

  const handleSendMessage = (msg: string) => {
    Alert.alert("Message Sent", `"${msg}" has been sent to the mentor.`);
    setCustomMessage("");
    setMessageModalVisible(false);
  };

  const handleAddReminder = () => {
    const calendarName = Platform.OS === 'ios' ? 'Apple Calendar / Wallet' : 'Google Calendar';
    Alert.alert(
      "Add Reminder",
      `Would you like to add this session to your ${calendarName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Add", style: "default", onPress: () => Alert.alert("Success", "Reminder added to your device!") }
      ]
    );
  };

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (bookingStatus === "pending") {
    return (
      <SafeAreaView style={styles.safePending}>
        <View style={styles.containerPending}>
          <ActivityIndicator size="large" color={PAL.SUNSET_ORANGE} style={{marginBottom: 20}} />
          <Text style={styles.titlePending}>Processing Booking...</Text>
          <Text style={styles.subtitlePending}>Assigning a qualified tutor for you.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* --- TOP HEADER --- */}
      <SafeAreaView style={styles.topHeaderSafeArea}>
        <View style={styles.topHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Feather name="chevron-left" size={28} color={PAL.PURE_WHITE} />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerSub}>Current Time: {formattedTime}</Text>
            <Text style={styles.headerTitle}>Arriving in {teacherLocation.eta} minutes</Text>
          </View>
          <View style={{ width: 28 }} /> 
        </View>
      </SafeAreaView>

      {/* --- SCROLLABLE CONTENT --- */}
      <ScrollView 
        style={styles.scrollArea} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* BOXED MAP CONTAINER */}
        <View style={styles.mapBox}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 28.6145, 
              longitude: 77.2095,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            scrollEnabled={true} 
            zoomEnabled={true}
          >
            <Marker coordinate={destinationLocation}>
              <View style={styles.destinationMarker}>
                <Ionicons name="home" size={14} color={PAL.PURE_WHITE} />
              </View>
            </Marker>
            <Marker coordinate={{ latitude: teacherLocation.latitude, longitude: teacherLocation.longitude }}>
              <View style={styles.mentorMarker}>
                <Text style={{ fontSize: 16 }}>👩‍🏫</Text>
              </View>
            </Marker>
            <Polyline
              coordinates={[
                { latitude: teacherLocation.latitude, longitude: teacherLocation.longitude },
                destinationLocation,
              ]}
              strokeColor={PAL.ROUTE_BLUE}
              strokeWidth={4}
            />
          </MapView>
          
          <Pressable style={styles.expandMapBtn} onPress={() => setIsMapExpanded(true)}>
            <Feather name="maximize-2" size={16} color={PAL.DARK_SLATE} />
          </Pressable>
        </View>

        {/* BOARDING PASS / MENTOR DETAILS */}
        <LinearGradient
          colors={[PAL.BOARDING_BG_TOP, PAL.BOARDING_BG_BOT]}
          style={styles.boardingPassCard}
        >
          <Text style={styles.brandText}>TutionWings Education</Text>

          <View style={styles.bpRow}>
            <View>
              <Text style={styles.bpTime}>10:00 AM</Text>
              <Text style={styles.bpLabel}>Booked</Text>
            </View>
            <View style={styles.bpCenterLine}>
              <View style={styles.bpDot} />
              <View style={styles.bpDashedLineHorizontal} />
              <Ionicons name="car-sport" size={18} color={PAL.ACCENT_BLUE} style={{marginHorizontal: 4}} />
              <View style={styles.bpDashedLineHorizontal} />
              <View style={styles.bpDot} />
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.bpTime}>10:{15 + (15 - teacherLocation.eta)} AM</Text>
              <Text style={styles.bpLabel}>ETA</Text>
            </View>
          </View>

          <View style={styles.bpDivider} />

          <View style={styles.bpRow}>
            <View>
              <Text style={styles.bpLabel}>Mentor ID</Text>
              <Text style={styles.bpValue}>{teacherLocation.id}</Text>
            </View>
            <View>
              <Text style={styles.bpLabel}>Age</Text>
              <Text style={styles.bpValue}>{teacherLocation.age} Yrs</Text>
            </View>
            <View>
              <Text style={styles.bpLabel}>Hours</Text>
              <Text style={styles.bpValue}>2 Hrs</Text>
            </View>
          </View>

          <View style={styles.bpDivider} />

          <View style={styles.peopleSection}>
            <Text style={[styles.bpLabel, { marginBottom: 12 }]}>Session Details</Text>
            <View style={styles.personRow}>
              <View style={styles.avatarPic}>
                <Text style={styles.avatarText}>👩‍🏫</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.personRole}>Mentor</Text>
                <Text style={styles.personName}>{teacherLocation.name}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.personRole}>Rating</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                  <Text style={styles.personName}>{teacherLocation.rating}</Text>
                  <AnimatedStar />
                </View>
              </View>
            </View>

            <View style={[styles.personRow, { marginTop: 12 }]}>
              <View style={styles.avatarPic}>
                <Text style={styles.avatarText}>👦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.personRole}>Student</Text>
                <Text style={styles.personName}>Aarav Kumar</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.personRole}>Subject</Text>
                <Text style={styles.personName}>Maths</Text>
              </View>
            </View>
          </View>

          <View style={styles.bpDividerDashedStyle} />

          <View style={styles.barcodeSection}>
            {!showCode ? (
              <Pressable style={styles.revealCodeBtn} onPress={() => setShowCode(true)}>
                <Feather name="maximize" size={16} color={PAL.DARK_SLATE} />
                <Text style={styles.revealCodeText}>Scan QR / View Code</Text>
              </Pressable>
            ) : (
              <View style={styles.codeRevealedBox}>
                <Text style={styles.bpLabel}>Attendance Code</Text>
                <BarcodeGraphic />
                <Text style={styles.actualCode}>{confirmationCode}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Add Reminder Button */}
        <Pressable style={styles.reminderBtn} onPress={handleAddReminder}>
          <Feather name={Platform.OS === 'ios' ? "calendar" : "bell"} size={18} color={PAL.DARK_SLATE} />
          <Text style={styles.reminderBtnText}>
            Add to {Platform.OS === 'ios' ? "Apple Calendar" : "Google Calendar"}
          </Text>
        </Pressable>

        {/* BOTTOM ACTIONS (Call & Message) */}
        <View style={styles.actionRow}>
          <Pressable style={styles.callBtn} onPress={() => Alert.alert("Calling...", "Connecting to Mentor")}>
            <Feather name="phone" size={18} color={PAL.PURE_WHITE} />
            <Text style={styles.actionBtnText}>Call</Text>
          </Pressable>
          
          <Pressable style={styles.messageBtn} onPress={() => setMessageModalVisible(true)}>
            <Feather name="message-square" size={18} color={PAL.PURE_WHITE} />
            <Text style={styles.actionBtnText}>Message Mentor</Text>
          </Pressable>
        </View>

      </ScrollView>

      {/* --- EXPANDED FULL SCREEN MAP MODAL --- */}
      <Modal visible={isMapExpanded} animationType="fade" transparent={false}>
        <View style={{ flex: 1 }}>
          <MapView
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: 28.6145, 
              longitude: 77.2095,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation
            showsCompass
          >
            <Marker coordinate={destinationLocation}>
              <View style={styles.destinationMarker}>
                <Ionicons name="home" size={14} color={PAL.PURE_WHITE} />
              </View>
            </Marker>
            <Marker coordinate={{ latitude: teacherLocation.latitude, longitude: teacherLocation.longitude }}>
              <View style={[styles.mentorMarker, { width: 44, height: 44, borderRadius: 22 }]}>
                <Text style={{ fontSize: 22 }}>👩‍🏫</Text>
              </View>
            </Marker>
            <Polyline
              coordinates={[
                { latitude: teacherLocation.latitude, longitude: teacherLocation.longitude },
                destinationLocation,
              ]}
              strokeColor={PAL.ROUTE_BLUE}
              strokeWidth={4}
            />
          </MapView>

          {/* Close Map Button */}
          <SafeAreaView style={styles.closeMapSafe}>
            <Pressable style={styles.closeMapBtn} onPress={() => setIsMapExpanded(false)}>
              <Feather name="minimize-2" size={24} color={PAL.DARK_SLATE} />
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>

      {/* --- CHAT MODAL --- */}
      <Modal
        visible={messageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMessageModalVisible(false)}
      >
        {/* Same Chat Modal Content as before */}
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={styles.chatSheet}
          >
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Message Mentor</Text>
              <Pressable onPress={() => setMessageModalVisible(false)} hitSlop={10}>
                <Feather name="x" size={24} color={PAL.DARK_SLATE} />
              </Pressable>
            </View>

            <Text style={styles.quickReplyTitle}>Quick Replies</Text>
            <View style={styles.quickRepliesWrap}>
              {QUICK_MESSAGES.map((msg, idx) => (
                <Pressable 
                  key={idx} 
                  style={styles.quickReplyBtn}
                  onPress={() => handleSendMessage(msg)}
                >
                  <Text style={styles.quickReplyText}>{msg}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type your own message..."
                placeholderTextColor="#9CA3AF"
                value={customMessage}
                onChangeText={setCustomMessage}
              />
              <Pressable 
                style={[styles.sendBtn, !customMessage.trim() && { opacity: 0.5 }]}
                disabled={!customMessage.trim()}
                onPress={() => handleSendMessage(customMessage)}
              >
                <Feather name="send" size={18} color={PAL.PURE_WHITE} />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safePending: { flex: 1, backgroundColor: PAL.SOFT_GRAY },
  containerPending: { flex: 1, justifyContent: "center", alignItems: "center" },
  titlePending: { fontSize: 20, fontWeight: "900", color: PAL.PRIMARY_NAVY, marginBottom: 6 },
  subtitlePending: { fontSize: 14, color: "rgba(31,41,55,0.70)" },

  mainContainer: { flex: 1, backgroundColor: PAL.SOFT_GRAY },

  topHeaderSafeArea: {
    backgroundColor: PAL.SUCCESS_GREEN,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === "android" ? 40 : 16,
  },
  backBtn: { padding: 4 },
  headerTextWrap: { alignItems: "center" },
  headerSub: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "700", marginBottom: 2 },
  headerTitle: { color: PAL.PURE_WHITE, fontSize: 18, fontWeight: "900" },

  scrollArea: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  mapBox: {
    width: "100%",
    height: 250,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    backgroundColor: PAL.PURE_WHITE,
  },
  map: { flex: 1 },
  destinationMarker: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: PAL.ROUTE_BLUE,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: PAL.PURE_WHITE,
  },
  mentorMarker: {
    width: 36, height: 36, borderRadius: 18, 
    backgroundColor: "#FDE047", 
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#000",
  },
  expandMapBtn: {
    position: "absolute",
    top: 12, right: 12,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: PAL.PURE_WHITE,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3,
  },

  closeMapSafe: { position: "absolute", top: Platform.OS === "android" ? 40 : 20, right: 20 },
  closeMapBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: PAL.PURE_WHITE,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5,
  },

  boardingPassCard: {
    borderRadius: 24, padding: 20,
    shadowColor: "#000", shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    marginBottom: 16,
  },
  brandText: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "700", marginBottom: 16 },
  bpRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bpTime: { color: PAL.PURE_WHITE, fontSize: 22, fontWeight: "800", letterSpacing: 1 },
  bpLabel: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "600", textTransform: "uppercase", marginTop: 2 },
  bpValue: { color: PAL.PURE_WHITE, fontSize: 15, fontWeight: "700", marginTop: 4 },
  bpCenterLine: { flexDirection: "row", alignItems: "center", flex: 1, marginHorizontal: 12 },
  bpDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: PAL.ACCENT_BLUE },
  bpDashedLineHorizontal: { flex: 1, height: 1, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", borderStyle: "dashed", borderRadius: 1 },
  bpDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 16 },
  bpDividerDashedStyle: { height: 1, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", borderStyle: "dashed", borderRadius: 1, marginVertical: 16 },

  peopleSection: {},
  personRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarPic: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20 },
  personRole: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "600", marginBottom: 2 },
  personName: { color: PAL.PURE_WHITE, fontSize: 15, fontWeight: "800" },

  barcodeSection: { alignItems: "center", minHeight: 60, justifyContent: "center" },
  revealCodeBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: PAL.ACCENT_BLUE,
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, width: "100%", justifyContent: "center"
  },
  revealCodeText: { color: PAL.DARK_SLATE, fontWeight: "900", fontSize: 15 },
  codeRevealedBox: { backgroundColor: PAL.PURE_WHITE, width: "100%", borderRadius: 12, padding: 12, alignItems: "center" },
  barcodeContainer: { flexDirection: "row", height: 40, alignItems: "center", marginVertical: 8, opacity: 0.8 },
  actualCode: { color: PAL.DARK_SLATE, fontSize: 18, fontWeight: "900", letterSpacing: 4 },

  reminderBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#E2E8F0", paddingVertical: 14, borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1, borderColor: "#CBD5E1",
  },
  reminderBtnText: { color: PAL.DARK_SLATE, fontWeight: "800", fontSize: 14 },

  actionRow: { flexDirection: "row", gap: 12 },
  callBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: PAL.SUCCESS_GREEN, paddingVertical: 16, borderRadius: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  messageBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: PAL.PRIMARY_NAVY, paddingVertical: 16, borderRadius: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  actionBtnText: { color: PAL.PURE_WHITE, fontWeight: "900", fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  chatSheet: { backgroundColor: PAL.PURE_WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === "ios" ? 40 : 20 },
  chatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  chatTitle: { fontSize: 18, fontWeight: "900", color: PAL.DARK_SLATE },
  quickReplyTitle: { fontSize: 12, fontWeight: "700", color: "#6B7280", marginBottom: 10, textTransform: "uppercase" },
  quickRepliesWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  quickReplyBtn: { backgroundColor: "#F3F4F6", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "#E5E7EB" },
  quickReplyText: { color: PAL.DARK_SLATE, fontSize: 13, fontWeight: "600" },
  chatInputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  chatInput: { flex: 1, height: 50, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 25, paddingHorizontal: 16, color: PAL.DARK_SLATE, fontWeight: "600" },
  sendBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: PAL.PRIMARY_NAVY, alignItems: "center", justifyContent: "center" },
});