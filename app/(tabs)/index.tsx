import { useEffect } from "react";
import { router } from "expo-router";

export default function HomeScreen() {
  // This screen is no longer used; immediately send users to the dashboard.
  useEffect(() => {
    router.replace("/(tabs)/parent-dashboard");
  }, []);

  return null;
}
