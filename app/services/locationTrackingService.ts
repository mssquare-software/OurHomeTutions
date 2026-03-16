import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

const LOCATION_TRACKING_TASK = "location-tracking-task";

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;
}

export const startLocationTracking = async (
  onLocationUpdate: (location: LocationData) => void
) => {
  try {
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Location permission denied");
      return false;
    }

    // Watch location with high accuracy
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Update every 10 meters
      },
      (location) => {
        const locationData: LocationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
          accuracy: location.coords.accuracy || 0,
        };
        onLocationUpdate(locationData);
      }
    );

    return subscription;
  } catch (error) {
    console.log("Error starting location tracking:", error);
    return null;
  }
};

export const stopLocationTracking = (subscription: any) => {
  if (subscription) {
    subscription.remove();
  }
};

// Background location tracking for tutors
TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }) => {
  if (error) {
    console.log("Location tracking error:", error);
    return;
  }

  if (data) {
    const { locations } = data as any;
    const location = locations[0];

    // Update location in AsyncStorage or send to server
    console.log("Background location update:", {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  }
});

export const startBackgroundLocationTracking = async () => {
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Background location permission denied");
      return false;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 5000,
      distanceInterval: 10,
    });

    return true;
  } catch (error) {
    console.log("Error starting background location tracking:", error);
    return false;
  }
};

export const stopBackgroundLocationTracking = async () => {
  try {
    await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
  } catch (error) {
    console.log("Error stopping background location tracking:", error);
  }
};