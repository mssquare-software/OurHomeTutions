import { Feather, Ionicons } from "@expo/vector-icons";
import { Audio } from 'expo-av';
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard, // Added
  KeyboardAvoidingView, // Added
  Platform,
  Pressable,
  SafeAreaView, // Added
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function AssistanceModeScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashText, setSplashText] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [showEyes, setShowEyes] = useState(false);
  const [chatInput, setChatInput] = useState(""); // State for keyboard input

  const fullSplashText = "Hello! I'm MIRA, your AI assistant.";
  const fullAssistantText = "Hey I am Mira you personalize AI Assistance How Can I help You Today";

  // --- REFS ---
  const splashAudio = useRef<Audio.Sound | null>(null);
  const splashFade = useRef(new Animated.Value(1)).current;
  const playBtnOpacity = useRef(new Animated.Value(0)).current;
  const splashOrbY = useRef(new Animated.Value(-height)).current; 
  const eyeLook = useRef(new Animated.Value(0)).current; 
  const bounceValue = useRef(new Animated.Value(0)).current; 

  // 1. CINEMATIC ENTRANCE & AUTO-PLAY MUSIC
  useEffect(() => {
    if (showSplash) {
      const startCinematic = async () => {
        try {
          const { sound } = await Audio.Sound.createAsync(
            require("../../assets/ai-mode/chime.mp3"),
            { isLooping: true, volume: 0.6 }
          );
          splashAudio.current = sound;
          await sound.playAsync();
        } catch (e) { console.log("Audio Error:", e); }

        Animated.sequence([
          Animated.timing(splashOrbY, {
            toValue: 0,
            duration: 900,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
          Animated.delay(100),
        ]).start(() => {
          setShowEyes(true);
          Animated.sequence([
            Animated.timing(eyeLook, { toValue: -10, duration: 400, useNativeDriver: true }),
            Animated.delay(150),
            Animated.timing(eyeLook, { toValue: 10, duration: 500, useNativeDriver: true }),
            Animated.delay(150),
            Animated.timing(eyeLook, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]).start(() => {
            startSplashTyping();
            Animated.timing(playBtnOpacity, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }).start();
          });
        });
      };
      startCinematic();
      return () => {
        if (splashAudio.current) splashAudio.current.unloadAsync();
      };
    }
  }, [showSplash]);

  const startSplashTyping = () => {
    let i = 0;
    const interval = setInterval(() => {
      setSplashText(fullSplashText.slice(0, i + 1));
      i++;
      if (i >= fullSplashText.length) clearInterval(interval);
    }, 40);
  };

  const handlePlayPress = async () => {
    try {
      if (splashAudio.current) {
        await splashAudio.current.stopAsync();
        await splashAudio.current.unloadAsync();
        splashAudio.current = null;
      }
      Animated.timing(splashFade, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
        startAssistantLogic();
      });
    } catch (e) {
      setShowSplash(false);
      startAssistantLogic();
    }
  };

  const startAssistantLogic = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, { toValue: -25, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bounceValue, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    let index = 0;
    const typingInterval = setInterval(() => {
      setDisplayedText(fullAssistantText.slice(0, index + 1));
      index++;
      if (index >= fullAssistantText.length) clearInterval(typingInterval);
    }, 50);

    Speech.speak(fullAssistantText, { rate: 0.9, pitch: 1.0 });
  };

  // Function to handle sending message
  const handleSendMessage = () => {
    if (chatInput.trim().length > 0) {
      console.log("Message Sent:", chatInput);
      setChatInput("");
      Keyboard.dismiss();
    }
  };

  if (showSplash) {
    return (
      <Animated.View style={[styles.container, { opacity: splashFade }]}>
        <LinearGradient colors={["#D8CAFA", "#F7F6FF"]} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={styles.centerContent}>
          <Text style={styles.splashTitle}>MIRA</Text>
          <View style={[styles.splashChatBubble, { opacity: splashText ? 1 : 0 }]}>
             <Text style={styles.splashChatText}>{splashText}</Text>
          </View>
          <Animated.View style={[styles.orbWrapper, { transform: [{ translateY: splashOrbY }] }]}>
             <LinearGradient colors={["#E858FF", "#8F54FF"]} style={styles.splashOrb}>
                {showEyes && (
                  <Animated.View style={[styles.eyeRow, { transform: [{ translateX: eyeLook }] }]}>
                    <View style={styles.eye} />
                    <View style={styles.eye} />
                  </Animated.View>
                )}
             </LinearGradient>
             <View style={styles.ballShadowSplash} />
          </Animated.View>
          <View style={{ opacity: splashText ? 1 : 0, alignItems: 'center' }}>
            <Text style={styles.getStartedText}>Let's get started!</Text>
            <Text style={styles.tasksText}>I'll help you with any tasks</Text>
          </View>
          <Animated.View style={{ opacity: playBtnOpacity }}>
            <TouchableOpacity onPress={handlePlayPress} style={styles.playBtnCircle}>
              <Ionicons name="play" size={32} color="white" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    );
  }
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient colors={["#FFFFFF", "#E5CDFF", "#B6E5FF"]} style={StyleSheet.absoluteFillObject} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Feather name="chevron-left" size={28} color="#1F3E3A" />
            </Pressable>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.content}>
            <View style={styles.ballWrapper}>
              <Animated.View
                style={[styles.glowBall, { transform: [{ translateY: bounceValue }] }]}
              >
                <LinearGradient
                  colors={["#E858FF", "#8F54FF", "#4E9FFF"]}
                  style={styles.ballGradient}
                >
                  <View style={styles.eyeRow}>
                    <View style={styles.eye} />
                    <View style={styles.eye} />
                  </View>
                </LinearGradient>
              </Animated.View>
              <View style={styles.ballShadow} />
            </View>

            <View style={styles.glassCard}>
              <Text style={styles.writingText}>{displayedText}</Text>
            </View>
          </View>

          {/* BOTTOM SECTION */}
          <View style={styles.footerContainer}>
            <View style={styles.actionGrid}>
              <View style={styles.row}>
                <TouchableOpacity style={styles.actionItem}>
                  <Text style={styles.actionText}>Create an image</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem}>
                  <Text style={styles.actionText}>Give me ideas</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* INPUT BAR WITH KEYBOARD AND SEND OPTION */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask me anything..."
                placeholderTextColor="#9CA3AF"
                value={chatInput}
                onChangeText={setChatInput}
                multiline={false}
              />
              {chatInput.length > 0 ? (
                <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
                  <Ionicons name="send" size={20} color="white" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.micButton}>
                  <Ionicons name="mic" size={22} color="#8F54FF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashTitle: { fontSize: 36, fontWeight: "800", color: "#8A7CE8", marginBottom: 15, letterSpacing: 2 },
  splashChatBubble: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, marginBottom: 40, minHeight: 50, justifyContent: 'center', elevation: 4 },
  splashChatText: { color: '#4F3267', fontWeight: '700', fontSize: 15 },
  splashOrb: { width: 150, height: 150, borderRadius: 75, justifyContent: 'center', alignItems: 'center', elevation: 10, overflow: 'hidden' },
  orbWrapper: { marginBottom: 50, alignItems: 'center' },
  ballShadowSplash: { width: 60, height: 8, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 10, marginTop: 25 },
  getStartedText: { fontSize: 24, fontWeight: '800', color: '#8A7CE8', textAlign: 'center' },
  tasksText: { fontSize: 16, color: '#8A7CE8', opacity: 0.8, marginBottom: 50, textAlign: 'center' },
  playBtnCircle: { width: 75, height: 75, borderRadius: 38, backgroundColor: '#8F54FF', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 10 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "white", justifyContent: "center", alignItems: "center", elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1F3E3A" },
  
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 },
  ballWrapper: { alignItems: 'center', marginBottom: 40 },
  glowBall: { width: 140, height: 140, borderRadius: 70, elevation: 20, overflow: 'hidden' },
  ballGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  eyeRow: { flexDirection: 'row', gap: 12 },
  eye: { width: 12, height: 20, borderRadius: 6, backgroundColor: 'white' },
  ballShadow: { width: 80, height: 12, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 10, marginTop: 20 },
  glassCard: { padding: 24, backgroundColor: "rgba(255, 255, 255, 0.7)", borderRadius: 24, minHeight: 120, width: '100%', justifyContent: 'center' },
  writingText: { fontSize: 20, fontWeight: "700", color: "#4F3267", textAlign: "center", lineHeight: 30 },
  
  footerContainer: { padding: 20, gap: 10 },
  actionGrid: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  actionItem: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#E5CDFF' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#8F54FF' },
  
  inputBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 8,
    paddingLeft: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F3E3A",
    paddingVertical: 8,
  },
  micButton: {
    padding: 8,
  },
  sendButton: {
    backgroundColor: "#8F54FF",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  }
});