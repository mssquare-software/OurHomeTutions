import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Platform } from "react-native";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Message {
  id: string;
  type: "mentor" | "admin" | "system";
  senderName: string;
  senderAvatar?: string;
  subject: string;
  message: string;
  timestamp: string;
  read: boolean;
  bookingId?: string;
  actionRequired?: boolean;
}

export default function Inbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      // Mock data - in real app, fetch from backend API
      const mockMessages: Message[] = [
        {
          id: "1",
          type: "mentor",
          senderName: "Dr. Sarah Johnson",
          senderAvatar: "https://i.pravatar.cc/150?img=33",
          subject: "Mathematics Session Confirmed",
          message: "Hi! I'm looking forward to teaching Mathematics to your child on March 12th at 10:00 AM. Please ensure the student has the required materials ready.",
          timestamp: "2026-03-17T10:30:00Z",
          read: false,
          bookingId: "booking_123",
          actionRequired: false,
        },
        {
          id: "2",
          type: "admin",
          senderName: "OurHomeTutions Admin",
          subject: "Payment Successful",
          message: "Your payment of ₹1000 for Mathematics tutoring has been successfully processed. Tutor has been assigned and will contact you soon.",
          timestamp: "2026-03-17T09:15:00Z",
          read: true,
          bookingId: "booking_123",
        },
        {
          id: "3",
          type: "mentor",
          senderName: "Prof. Michael Chen",
          senderAvatar: "https://i.pravatar.cc/150?img=47",
          subject: "Science Class Materials",
          message: "For tomorrow's Science class, please have the student bring a notebook, pen, and the textbook. We'll be covering Chemistry basics.",
          timestamp: "2026-03-16T15:45:00Z",
          read: true,
          bookingId: "booking_124",
        },
        {
          id: "4",
          type: "system",
          senderName: "System Notification",
          subject: "Session Reminder",
          message: "Reminder: You have a Mathematics session scheduled for tomorrow at 10:00 AM with Dr. Sarah Johnson.",
          timestamp: "2026-03-16T08:00:00Z",
          read: false,
          actionRequired: false,
        },
        {
          id: "5",
          type: "admin",
          senderName: "OurHomeTutions Support",
          subject: "Welcome to OurHomeTutions!",
          message: "Thank you for choosing OurHomeTutions! We're excited to help your child excel in their studies. Feel free to reach out if you need any assistance.",
          timestamp: "2026-03-15T12:00:00Z",
          read: true,
        },
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    );
  };

  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "mentor":
        return <Ionicons name="person" size={20} color="#78C4A4" />;
      case "admin":
        return <Ionicons name="shield-checkmark" size={20} color="#E86E36" />;
      case "system":
        return <Ionicons name="notifications" size={20} color="#9CA3AF" />;
      default:
        return <Ionicons name="mail" size={20} color="#78C4A4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#FFFFFF", "#DFF4E8"]} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Feather name="chevron-left" size={24} color="#1F3E3A" />
            </Pressable>
            <Text style={styles.headerTitle}>Inbox</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#FFFFFF", "#DFF4E8"]} style={StyleSheet.absoluteFillObject} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={24} color="#1F3E3A" />
          </Pressable>
          <Text style={styles.headerTitle}>Inbox</Text>
          <Pressable style={styles.markAllReadBtn}>
            <Feather name="check-square" size={20} color="#78C4A4" />
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="mail-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Messages</Text>
              <Text style={styles.emptySubtitle}>Your inbox is empty</Text>
            </View>
          ) : (
            messages.map((message) => (
              <Pressable
                key={message.id}
                style={[styles.messageCard, !message.read && styles.unreadCard]}
                onPress={() => {
                  markAsRead(message.id);
                  // Could navigate to message details
                }}
              >
                <View style={styles.messageHeader}>
                  <View style={styles.senderInfo}>
                    <View style={styles.iconContainer}>
                      {getMessageIcon(message.type)}
                    </View>
                    <View style={styles.senderDetails}>
                      <Text style={[styles.senderName, !message.read && styles.unreadText]}>
                        {message.senderName}
                      </Text>
                      <Text style={styles.timestamp}>
                        {formatTimestamp(message.timestamp)}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => deleteMessage(message.id)}
                  >
                    <Feather name="trash-2" size={16} color="#9CA3AF" />
                  </Pressable>
                </View>

                <Text style={styles.subject}>{message.subject}</Text>
                <Text style={styles.message} numberOfLines={2}>
                  {message.message}
                </Text>

                {message.actionRequired && (
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionText}>Action Required</Text>
                  </View>
                )}

                {!message.read && (
                  <View style={styles.unreadDot} />
                )}
              </Pressable>
            ))
          )}
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
  markAllReadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(120, 196, 164, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F3E3A",
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
  messageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(120, 196, 164, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  unreadCard: {
    backgroundColor: "rgba(120, 196, 164, 0.05)",
    borderColor: "#78C4A4",
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  senderInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(120, 196, 164, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  senderDetails: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F3E3A",
    marginBottom: 2,
  },
  unreadText: {
    fontWeight: "700",
  },
  timestamp: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(156, 163, 175, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  subject: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F3E3A",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  actionBadge: {
    backgroundColor: "#E86E36",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#78C4A4",
  },
});
