import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { Colors } from "../constants/colors";

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.secondary,
        pressed && (variant === "primary" ? styles.primaryPressed : { opacity: 0.92 }),
        style,
      ]}
    >
      <Text style={[styles.text, variant === "primary" ? styles.textPrimary : styles.textSecondary]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: "#6366F1" }, // Aurora brand.primary.base
  primaryPressed: { backgroundColor: "#4F46E5" }, // Aurora brand.primary.hover
  secondary: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(229,231,235,0.20)",
  },
  text: { fontSize: 16, fontWeight: "800" },
  textPrimary: { color: Colors.utility.pureWhite },
  textSecondary: { color: Colors.utility.pureWhite },
});