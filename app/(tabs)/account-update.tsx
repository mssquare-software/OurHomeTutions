import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useUser } from "../context/UserContext";

interface AccountData {
  parentName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export default function AccountUpdate() {
  const { parentName, updateUserName, clearUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AccountData>({
    parentName: parentName || "",
    email: "aa@gmail.com", // Default Gmail address
    phone: "9876543210",
    address: "123 Main Street, Apartment 4B",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500001",
  });

  const [errors, setErrors] = useState<Partial<AccountData>>({});

  const validateForm = () => {
    const newErrors: Partial<AccountData> = {};

    if (!formData.parentName.trim()) {
      newErrors.parentName = "Parent name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call backend API to update account
      const response = await fetch('http://192.168.0.34:8080/api/payment/update-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: "parent_001",
          ...formData
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local user context
        updateUserName(formData.parentName);
        
        // Show success message with login info
        Alert.alert(
          "✅ Account Updated Successfully!",
          `Your account has been updated.\n\n📧 New Email: ${formData.email}\n👤 Name: ${formData.parentName}\n\nYou can now login with your new email address. Your password remains the same for security.`,
          [
            {
              text: "OK",
              onPress: () => {
                // Optional: Clear user session to force re-login with new credentials
                // clearUser();
                // router.replace("/(auth)/login");
                router.back();
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to update account");
      }
    } catch (error) {
      console.error('Update account error:', error);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    error,
    keyboardType = "default",
    placeholder,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    error?: string;
    keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
    placeholder?: string;
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#FFFFFF", "#DFF4E8"]} style={StyleSheet.absoluteFillObject} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={24} color="#1F3E3A" />
          </Pressable>
          <Text style={styles.headerTitle}>Update Account</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <InputField
              label="Parent Name"
              value={formData.parentName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, parentName: text }))}
              error={errors.parentName}
              placeholder="Enter your full name"
            />

            <InputField
              label="Email Address"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              error={errors.email}
              keyboardType="email-address"
              placeholder="your.email@example.com"
            />

            <InputField
              label="Phone Number"
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              error={errors.phone}
              keyboardType="phone-pad"
              placeholder="10-digit mobile number"
            />
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
            <InputField
              label="Street Address"
              value={formData.address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
              error={errors.address}
              placeholder="House number, street, apartment"
            />

            <InputField
              label="City"
              value={formData.city}
              onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
              error={errors.city}
              placeholder="Your city"
            />

            <InputField
              label="State"
              value={formData.state}
              onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
              error={errors.state}
              placeholder="Your state"
            />

            <InputField
              label="Pincode"
              value={formData.pincode}
              onChangeText={(text) => setFormData(prev => ({ ...prev, pincode: text }))}
              error={errors.pincode}
              keyboardType="numeric"
              placeholder="6-digit pincode"
            />
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.updateBtn, loading && styles.updateBtnDisabled]}
              onPress={handleUpdate}
              disabled={loading}
            >
              <Text style={styles.updateBtnText}>
                {loading ? "Updating..." : "Update Account"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.cancelBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(120, 196, 164, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F3E3A",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(120, 196, 164, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F3E3A",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F3E3A",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1F3E3A",
  },
  inputError: {
    borderColor: "#E86E36",
    backgroundColor: "#FEF3E2",
  },
  errorText: {
    fontSize: 12,
    color: "#E86E36",
    marginTop: 4,
  },
  buttonContainer: {
    paddingVertical: 20,
    gap: 12,
  },
  updateBtn: {
    backgroundColor: "#78C4A4",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#78C4A4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  updateBtnDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
  updateBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancelBtn: {
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
});
