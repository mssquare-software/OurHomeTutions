import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { DUMMY_PARENT } from "../../constants/dummyAuth";
import { useGlobalLoader } from "../context/LoadingOverlayContext";
import { useUser } from "../context/UserContext";

export default function Login() {
  const [mode, setMode] = useState<"options" | "email">("options");
  const { show } = useGlobalLoader();
  const { setUser } = useUser();

  // State for form
  const [email, setEmail] = useState<string>(DUMMY_PARENT.email);
  const [password, setPassword] = useState<string>(DUMMY_PARENT.password);
  const [showPassword, setShowPassword] = useState(false);

  const onLogin = async () => {
    const ok =
      email.trim().toLowerCase() === DUMMY_PARENT.email &&
      password === DUMMY_PARENT.password;

    if (!ok) {
      Alert.alert("Invalid credentials", "Use: parent@demo.com / Parent@123");
      return;
    }

    await setUser(email.trim().toLowerCase(), "Rajan Kumar");
    show();
    router.replace("/(tabs)/parent-dashboard");
  };

  return (
    <View style={styles.container}>
      {/* Full Screen Gradient Background */}
      <LinearGradient
        colors={["#A11A39", "#1F142D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {mode === "options" ? (
        // ==========================================
        // SCREEN 1: "OPTIONS" (Welcome Back Screen)
        // ==========================================
        <SafeAreaView style={styles.fullScreenCenter}>
          <View style={styles.logoContainer}>
            {/* Replaced dumbbell with an Education/Book icon for Home Tuition */}
            <Ionicons name="book" size={64} color="#FFFFFF" />
            <Text style={styles.logoText}>HOME TUITION</Text>
          </View>

          <Text style={styles.welcomeBackText}>Welcome Back</Text>

          <View style={styles.optionsButtonContainer}>
            {/* Outlined Sign In Button */}
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => setMode("email")}
            >
              <Text style={styles.outlineButtonText}>SIGN IN</Text>
            </TouchableOpacity>

            {/* Solid Sign Up Button */}
            <TouchableOpacity
              style={styles.solidButton}
              onPress={() => router.push("/(auth)/signup")}
            >
              <Text style={styles.solidButtonText}>SIGN UP</Text>
            </TouchableOpacity>
          </View>

          {/* Social Media Footer */}
          <View style={styles.socialFooter}>
            <Text style={styles.socialText}>Login with Social Media</Text>
            <View style={styles.socialIconsRow}>
              <TouchableOpacity style={styles.socialIconCircle}>
                <FontAwesome5 name="instagram" size={20} color="#1F142D" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconCircle}>
                <FontAwesome5 name="twitter" size={20} color="#1F142D" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconCircle}>
                <FontAwesome5 name="facebook-f" size={20} color="#1F142D" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      ) : (
        // ==========================================
        // SCREEN 2: "EMAIL" (Login Form Bottom Sheet)
        // ==========================================
        <View style={styles.flexOne}>
          <SafeAreaView style={styles.headerSafeArea}>
            <View style={styles.headerContainer}>
              <View>
                {/* Optional Back Button to go back to options */}
                <TouchableOpacity onPress={() => setMode("options")} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Hello{"\n"}Sign in!</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="ellipsis-horizontal" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <KeyboardAvoidingView
            style={styles.flexOne}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.card}>
                <View style={styles.formContainer}>
                  {/* Email Input */}
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

                  {/* Password Input */}
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

                  {/* Forgot Password */}
                  <TouchableOpacity
                    onPress={() => Alert.alert("Forgot Password", "Coming soon")}
                    style={styles.forgotPasswordContainer}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </TouchableOpacity>

                  {/* Hint for development */}
                  <Text style={styles.hint}>
                    Hint: parent@demo.com / Parent@123
                  </Text>
                </View>

                {/* Sign In Button (Gradient) */}
                <TouchableOpacity
                  style={styles.buttonWrapper}
                  activeOpacity={0.8}
                  onPress={onLogin}
                >
                  <LinearGradient
                    colors={["#A11A39", "#281A35"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonTextGradient}>SIGN IN</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Footer Text */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Don't have account? </Text>
                  <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
                    <Text style={styles.footerLink}>Sign up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },

  // ==========================================
  // OPTIONS SCREEN STYLES
  // ==========================================
  fullScreenCenter: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 60,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "300",
    letterSpacing: 2,
    marginTop: 12,
  },
  welcomeBackText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "600",
    marginBottom: 40,
  },
  optionsButtonContainer: {
    width: "80%",
    gap: 20,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
  },
  outlineButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  solidButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
  },
  solidButtonText: {
    color: "#1F142D",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  socialFooter: {
    alignItems: "center",
    marginBottom: 20,
  },
  socialText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 16,
  },
  socialIconsRow: {
    flexDirection: "row",
    gap: 16,
  },
  socialIconCircle: {
    width: 40,
    height: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  // ==========================================
  // LOGIN FORM (EMAIL) STYLES
  // ==========================================
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
  backButton: {
    marginBottom: 8,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#FAFAFA",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: Platform.OS === "ios" ? 40 : 30,
    minHeight: "75%",
  },
  formContainer: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: "#A11A39",
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
    paddingVertical: 0,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginTop: -8,
  },
  forgotPasswordText: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "500",
  },
  hint: {
    marginTop: 20,
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12,
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
  buttonTextGradient: {
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