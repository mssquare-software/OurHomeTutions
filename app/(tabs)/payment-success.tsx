import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import LottieView from "lottie-react-native";

const PAL = {
  DARK_SLATE: "#0F172A",
  GREEN: "#10B981",
  PURE_WHITE: "#FFFFFF",
  PRIMARY_NAVY: "#1B2A5A",
  SUNSET_ORANGE: "#ffb76c",
};

export default function PaymentSuccessScreen() {
  const { bookingId } = useLocalSearchParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace({
        pathname: "/(tabs)/delivery-tracking",
        params: { bookingId },
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [bookingId]);

  return (
    <View style={styles.container}>
      {/* Success Animation */}
      <LottieView
        source={require("../../assets/animations/success.json")}
        autoPlay
        loop={false}
        style={styles.animation}
      />

      {/* Success Message */}
      <Text style={styles.title}>Payment Successful! 🎉</Text>
      <Text style={styles.subtitle}>
        Your booking has been confirmed. Your tutor will be on the way soon.
      </Text>

      {/* Booking ID */}
      <View style={styles.idContainer}>
        <Text style={styles.idLabel}>Booking ID</Text>
        <Text style={styles.idValue}>{bookingId}</Text>
      </View>

      {/* Action Button */}
      <Pressable
        style={styles.button}
        onPress={() =>
          router.replace({
            pathname: "/(tabs)/delivery-tracking",
            params: { bookingId },
          })
        }
      >
        <Text style={styles.buttonText}>Track Delivery</Text>
      </Pressable>

      {/* Auto Redirect Message */}
      <Text style={styles.redirectText}>Redirecting in 4 seconds...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAL.DARK_SLATE,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  animation: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: PAL.GREEN,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    marginBottom: 30,
    textAlign: "center",
  },
  idContainer: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 30,
    width: "100%",
    alignItems: "center",
  },
  idLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "700",
    marginBottom: 6,
  },
  idValue: {
    fontSize: 16,
    fontWeight: "900",
    color: PAL.SUNSET_ORANGE,
  },
  button: {
    backgroundColor: PAL.GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 30,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: PAL.PURE_WHITE,
    fontWeight: "900",
    fontSize: 14,
  },
  redirectText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },
});