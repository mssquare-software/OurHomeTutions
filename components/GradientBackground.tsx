import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../constants/colors";

export default function GradientBackground({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <LinearGradient
      colors={[Colors.brand.darkSlate, Colors.brand.heroNavy, Colors.brand.primaryNavy]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[styles.container, style]}
    >
      <View style={styles.overlay}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, padding: 20 },
});