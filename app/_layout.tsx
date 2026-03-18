import { Stack } from "expo-router";
import React from "react";
import { NotificationProvider } from "./context/NotificationContext";
import { LoadingOverlayProvider } from "./context/LoadingOverlayContext";
import { UserProvider } from "./context/UserContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AnimatedTourOverlay } from "./tour/AnimatedTourOverlay";
import { TourProvider } from "./tour/TourContext";

export default function RootLayout() {
  return (
    <NotificationProvider>
      <LanguageProvider>
        <UserProvider>
          <TourProvider>
          <LoadingOverlayProvider>
            <Stack
              initialRouteName="splash"
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name="splash" />
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(admin)" />
              <Stack.Screen name="(mentor)" />
              <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            </Stack>

            {/* ✅ Global tour overlay - always available */}
            <AnimatedTourOverlay />
          </LoadingOverlayProvider>
        </TourProvider>
        </UserProvider>
      </LanguageProvider>
    </NotificationProvider>
  );
}