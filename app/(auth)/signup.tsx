import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { registerUser, type UserRole } from "../services/authService";
import { sendWelcomeEmail } from "../services/emailService";

type RegisterRole = "Parent" | "Admin" | "Mentor";

export default function SignUp() {
  const [role, setRole] = useState<RegisterRole>("Parent");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const toUserRole = (r: RegisterRole): UserRole =>
    r === "Parent" ? "parent" : r === "Admin" ? "admin" : "mentor";

  const onSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      alert("Please fill all fields");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await registerUser({
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        password,
        role: toUserRole(role),
      });

      await sendWelcomeEmail({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: toUserRole(role),
      });

      alert("Signup successful! Please sign in with the same email and password.");
      router.push("/(auth)/login");
    } catch (err: any) {
      alert(err.message ?? "Unable to sign up. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Full Screen Gradient Background */}
      <LinearGradient
        colors={["#A11A39", "#1F142D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* 2. Top Header Section */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Create Your{"\n"}Account</Text>
          <TouchableOpacity>
            <Feather name="more-horizontal" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* 3. The White Bottom Card Area */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.card}>
            
            {/* Register as: Parent / Admin / Mentor */}
            <View style={styles.roleSection}>
              <Text style={styles.roleLabel}>Register as</Text>
              <View style={styles.roleRow}>
                {(["Parent", "Admin", "Mentor"] as const).map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setRole(r)}
                    style={[styles.roleChip, role === r && styles.roleChipActive]}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        role === r && styles.roleChipTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="John Smith"
                    placeholderTextColor="#9CA3AF"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                  <Ionicons name="checkmark-outline" size={20} color="#9CA3AF" />
                </View>
              </View>

              {/* Email / Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gmail</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Joydeo@gmail.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                  <Ionicons name="checkmark-outline" size={20} color="#9CA3AF" />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

            </View>

            {/* Sign Up Button (Gradient) */}
            <TouchableOpacity 
              style={styles.buttonWrapper}
              activeOpacity={0.8}
              onPress={onSignUp}
            >
              <LinearGradient
                colors={["#A11A39", "#281A35"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>SIGN UP</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Footer Text */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSafeArea: {
    zIndex: 10,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 30,
    paddingTop: Platform.OS === "android" ? 40 : 20,
    paddingBottom: 40,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end", // Pushes the card to the bottom
  },
  card: {
    backgroundColor: "#FAFAFA",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    minHeight: "75%", // Ensures it takes up most of the screen
  },
  roleSection: {
    marginBottom: 28,
  },
  roleLabel: {
    color: "#A11A39",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: "row",
    gap: 12,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  roleChipActive: {
    borderColor: "#A11A39",
    backgroundColor: "rgba(161, 26, 57, 0.08)",
  },
  roleChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
  },
  roleChipTextActive: {
    color: "#A11A39",
  },
  formContainer: {
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: "#A11A39", // Matches the burgundy theme
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 0, // Removes default Android padding
  },
  buttonWrapper: {
    shadowColor: "#A11A39",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 40,
  },
  buttonGradient: {
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  footerLink: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "bold",
  },
});