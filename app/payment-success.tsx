import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import LottieView from "lottie-react-native";

const PAL = {
  PRIMARY_NAVY: "#1B2A5A",
  DARK_SLATE: "#0F172A",
  SUNSET_ORANGE: "#ffb76c",
  PURE_WHITE: "#FFFFFF",
  GREEN: "#10B981",
  SOFT_GRAY: "#F9FAFB",
};

export default function PaymentSuccess() {
  const { bookingId } = useLocalSearchParams();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 6,
      mass: 1,
      stiffness: 100,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handleContinue = () => {
    router.push({
      pathname: "/delivery-tracking",
      params: { bookingId },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Animation */}
        <Animated.View
          style={[
            styles.animationContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LottieView
            source={require("../assets/animations/success.json")}
            autoPlay
            loop={false}
            style={styles.animation}
          />
        </Animated.View>

        {/* Success Message */}
        <Text style={styles.title}>Payment Successful! 🎉</Text>
        <Text style={styles.subtitle}>
          Your booking has been confirmed. Your tutor will be on the way soon!
        </Text>

        {/* Booking Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Booking ID</Text>
            <Text style={styles.value}>{bookingId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, { color: PAL.GREEN }]}>Confirmed</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Next Step</Text>
            <Text style={styles.value}>Tutor Assigned</Text>
          </View>
        </View>

        {/* Call to Action */}
        <Pressable style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Track Your Tutor 📍</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(tabs)")}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAL.SOFT_GRAY,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  animationContainer: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  animation: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: PAL.PRIMARY_NAVY,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(31,41,55,0.70)",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20,
  },
  detailsCard: {
    width: "100%",
    backgroundColor: PAL.PURE_WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  label: {
    fontSize: 12,
    color: "rgba(31,41,55,0.65)",
    fontWeight: "700",
  },
  value: {
    fontSize: 13,
    color: PAL.DARK_SLATE,
    fontWeight: "900",
  },
  button: {
    width: "100%",
    height: 52,
    backgroundColor: PAL.PRIMARY_NAVY,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: PAL.PURE_WHITE,
    fontWeight: "900",
    fontSize: 14,
  },
  secondaryButton: {
    width: "100%",
    height: 52,
    backgroundColor: PAL.PURE_WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: PAL.PRIMARY_NAVY,
    fontWeight: "900",
    fontSize: 14,
  },
});