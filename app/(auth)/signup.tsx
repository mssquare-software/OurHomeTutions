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
  Alert,
  ActivityIndicator,
} from "react-native";
import { BackendService } from "../../services/backendService";

type RegisterRole = "Parent" | "Admin" | "Mentor";

export default function SignUp() {
  const [role, setRole] = useState<RegisterRole>("Parent");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validateForm = () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Username, email, and password are required");
      return false;
    }

    if (username.length < 3 || username.length > 20) {
      Alert.alert("Error", "Username must be between 3 and 20 characters");
      return false;
    }

    // Allow letters, numbers, spaces, and basic punctuation
    if (!/^[a-zA-Z0-9\s._-]+$/.test(username)) {
      Alert.alert("Error", "Username can only contain letters, numbers, spaces, dots, hyphens, and underscores");
      return false;
    }

    // Gmail validation - must end with @gmail.com
    if (!email.endsWith("@gmail.com")) {
      Alert.alert("Error", "Please enter a valid Gmail address (must end with @gmail.com)");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    console.log("=== SIGNUP DEBUG START ===");
    console.log("Username:", username);
    console.log("Email:", email);
    console.log("Password length:", password.length);
    console.log("Confirm Password:", confirmPassword);
    console.log("Role:", role);
    
    if (!validateForm()) return;

    console.log("Validation passed, starting API call...");
    setLoading(true);
    
    try {
      const roleMap = {
        "Parent": "parent",
        "Admin": "admin", 
        "Mentor": "tutor"
      };

      const userData = {
        username,
        role: roleMap[role] as "parent" | "admin" | "tutor"
      };
      
      console.log("Sending data:", userData);

      const response = await BackendService.register(
        email,
        password,
        userData
      );

      console.log("API Response:", response);

      if (response.success) {
        console.log("Registration successful!");
        Alert.alert(
          "Success!",
          "Account created successfully. Please sign in to continue.",
          [
            {
              text: "OK",
              onPress: () => {
                console.log("Navigating to login...");
                router.push("/(auth)/login");
              }
            }
          ]
        );
      } else {
        console.log("Registration failed:", response.error);
        Alert.alert("Registration Failed", response.error || "Something went wrong");
      }
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
      console.log("=== SIGNUP DEBUG END ===");
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
              
              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="john_doe"
                    placeholderTextColor="#9CA3AF"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Ionicons name="checkmark-outline" size={20} color="#9CA3AF" />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="yourname@gmail.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
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
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
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
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
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
              onPress={handleSignUp}
              disabled={loading}
            >
              <LinearGradient
                colors={["#A11A39", "#281A35"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>SIGN UP</Text>
                )}
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