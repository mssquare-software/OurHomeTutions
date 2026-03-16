import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Colors } from "../../constants/colors";

export default function AuthCardButton({
  title,
  subtitle,
  icon,
  variant = "primary",
  onPress,
  style,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary";
  onPress: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.secondary,
        pressed && { opacity: 0.92 },
        style,
      ]}
    >
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, variant === "primary" ? styles.titlePrimary : styles.titleSecondary]}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={[styles.subtitle, variant === "primary" ? styles.subPrimary : styles.subSecondary]}>
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  primary: {
    backgroundColor: Colors.brand.primaryNavy,
  },
  secondary: {
    backgroundColor: Colors.utility.pureWhite,
    borderWidth: 1,
    borderColor: Colors.utility.borderGray,
  },

  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  title: { fontWeight: "900", fontSize: 14 },
  subtitle: { marginTop: 2, fontSize: 12 },

  titlePrimary: { color: Colors.utility.pureWhite },
  subPrimary: { color: "rgba(255,255,255,0.80)" },

  titleSecondary: { color: Colors.brand.darkSlate },
  subSecondary: { color: "rgba(31,41,55,0.65)" },
});