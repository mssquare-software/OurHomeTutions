import React from "react";
import { Image, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/colors";

type AuthScreenShellProps = {
  title: string;
  subtitle?: string;
  heroImage?: any; // require("...") or undefined
  children: React.ReactNode;
};

export default function AuthScreenShell({
  title,
  subtitle,
  heroImage,
  children,
}: AuthScreenShellProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>H</Text>
          </View>

          {heroImage ? (
            <Image source={heroImage} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroPlaceholderText}>Auth Illustration</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <View style={styles.body}>{children}</View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.utility.softGray },
  container: { flex: 1, backgroundColor: Colors.utility.softGray },

  hero: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },

  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.brand.primaryNavy,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoText: { color: Colors.utility.pureWhite, fontWeight: "900", fontSize: 20 },

  heroImage: { width: "100%", height: 220, resizeMode: "contain" },
  heroPlaceholder: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.utility.borderGray,
    backgroundColor: Colors.utility.pureWhite,
    alignItems: "center",
    justifyContent: "center",
  },
  heroPlaceholderText: { color: "rgba(31,41,55,0.55)", fontWeight: "700" },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 6,
  },

  title: { fontSize: 28, fontWeight: "900", color: Colors.brand.darkSlate },
  subtitle: { marginTop: 6, fontSize: 13, color: "rgba(31,41,55,0.70)", lineHeight: 18 },

  body: { marginTop: 14 },
});