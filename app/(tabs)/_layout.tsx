import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="parent-dashboard"
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />

      <Tabs.Screen
        name="parent-dashboard"
        options={{
          title: "Dashboard",
        }}
      />

      <Tabs.Screen
        name="booking"
        options={{
          title: "Book",
        }}
      />

      <Tabs.Screen
        name="bookmarks"
        options={{
          title: "Bookmarks",
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Tabs>
  );
}