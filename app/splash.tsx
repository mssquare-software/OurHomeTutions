import { router } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useGlobalLoader } from "./context/LoadingOverlayContext";

const PAL = {
  PRIMARY_NAVY: "#1B2A5A",
  DARK_SLATE: "#0F172A",
  PURE_WHITE: "#FFFFFF",
  SUNSET_ORANGE: "#ffb76c",
} as const;

export default function SplashScreen() {
  const { show } = useGlobalLoader();

  // --- Animation Values ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current; // Start 20px lower
  
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // 1. Animate Text (Fade in & Slide up)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Animate Dots (Staggered pulsing loop)
    const createDotAnim = (anim: Animated.Value) => {
      return Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
    };

    Animated.loop(
      Animated.stagger(150, [
        createDotAnim(dot1Anim),
        createDotAnim(dot2Anim),
        createDotAnim(dot3Anim),
      ])
    ).start();

    // 3. Navigation Timer
    const timer = setTimeout(() => {
      show();
      router.replace("/index" as any);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Dynamic logo animation */}
      <View style={styles.animationContainer}>
        <LottieView
          // Make sure this path is correct for your project
          source={require("../assets/animations/home.json")}
          autoPlay
          loop
          style={styles.animation}
        />
      </View>

      {/* Animated brand text */}
      <Animated.View 
        style={{ 
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }],
          alignItems: "center"
        }}
      >
        <Animated.Text style={styles.appName}>Our Home Tutions</Animated.Text>
        <Animated.Text style={styles.tagline}>Instant tutors, right at your door</Animated.Text>
      </Animated.View>

      {/* Animated loading dots */}
      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.dot, { opacity: dot1Anim, transform: [{ scale: dot1Anim }] }]} />
        <Animated.View style={[styles.dot, { opacity: dot2Anim, transform: [{ scale: dot2Anim }] }]} />
        <Animated.View style={[styles.dot, { opacity: dot3Anim, transform: [{ scale: dot3Anim }] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAL.DARK_SLATE,
    justifyContent: "center",
    alignItems: "center",
  },
  animationContainer: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  animation: {
    flex: 1,
  },
  appName: {
    fontSize: 30,
    fontWeight: "900",
    color: PAL.SUNSET_ORANGE,
    marginBottom: 8,
    letterSpacing: 1.2,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    marginBottom: 40,
  },
  loadingContainer: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PAL.SUNSET_ORANGE,
  },
});