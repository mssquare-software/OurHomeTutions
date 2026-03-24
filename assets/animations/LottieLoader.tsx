import React from "react";
import { View, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

interface LottieLoaderProps {
  visible: boolean;
  size?: "small" | "medium" | "large";
}

export default function LottieLoader({
  visible,
  size = "medium",
}: LottieLoaderProps) {
  if (!visible) return null;

  const sizeMap = {
    small: 80,
    medium: 120,
    large: 180,
  };

  return (
    <View style={styles.container}>
      <LottieView
        source={require("../../assets/animations/circle-loader.json")}
        autoPlay
        loop
        style={{ width: sizeMap[size], height: sizeMap[size] }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
});