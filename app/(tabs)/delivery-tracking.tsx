import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import LottieView from "lottie-react-native";
import MapView, { Marker } from "react-native-maps";

const PAL = {
  DARK_SLATE: "#0F172A",
  PRIMARY_NAVY: "#1B2A5A",
  PURE_WHITE: "#FFFFFF",
  SUNSET_ORANGE: "#ffb76c",
  GREEN: "#10B981",
};

export default function DeliveryTrackingScreen() {
  const { bookingId } = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);

  const [deliveryPerson, setDeliveryPerson] = React.useState({
    name: "Ravi Kumar",
    rating: 4.8,
    location: { latitude: 28.7041, longitude: 77.1025 },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backBtn}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>Track Your Tutor</Text>
          <View style={{ width: 70 }} />
        </View>

        {/* Map with Delivery Person */}
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: 28.7041,
            longitude: 77.1025,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {/* Compass Animation */}
          <View style={styles.compassContainer}>
            <LottieView
              source={require("../../assets/animations/compass.json")}
              autoPlay
              loop
              style={styles.compass}
            />
          </View>

          {/* Delivery Person Marker */}
          <Marker
            coordinate={deliveryPerson.location}
            title={deliveryPerson.name}
            description="On the way to you"
          >
            <View style={styles.markerContainer}>
              <Text style={styles.markerIcon}>🚴</Text>
            </View>
          </Marker>
        </MapView>

        {/* Delivery Info Card */}
        <View style={styles.infoCard}>
          {/* Delivery Man Animation */}
          <LottieView
            source={require("../../assets/animations/delivery-man-calling-customer.json")}
            autoPlay
            loop
            style={styles.deliveryAnimation}
          />

          {/* Details */}
          <View style={styles.details}>
            <Text style={styles.tutorName}>{deliveryPerson.name}</Text>
            <Text style={styles.rating}>⭐ {deliveryPerson.rating}</Text>
            <Text style={styles.status}>Arriving in 8 minutes</Text>

            {/* ETA Progress */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: "35%" }]} />
              </View>
              <Text style={styles.etaText}>35% of the way</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Pressable style={styles.callBtn}>
                <Text style={styles.callBtnText}>📞 Call</Text>
              </Pressable>
              <Pressable style={styles.messageBtn}>
                <Text style={styles.messageBtnText}>💬 Message</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAL.DARK_SLATE },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PAL.PRIMARY_NAVY,
  },
  backBtn: {
    color: PAL.PURE_WHITE,
    fontWeight: "900",
    fontSize: 18,
  },
  title: {
    color: PAL.PURE_WHITE,
    fontWeight: "900",
    fontSize: 16,
  },
  map: {
    flex: 1,
  },
  compassContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 60,
    height: 60,
  },
  compass: {
    width: "100%",
    height: "100%",
  },
  markerContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PAL.SUNSET_ORANGE,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: PAL.PURE_WHITE,
  },
  markerIcon: {
    fontSize: 24,
  },
  infoCard: {
    backgroundColor: PAL.PRIMARY_NAVY,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexDirection: "row",
    gap: 16,
  },
  deliveryAnimation: {
    width: 100,
    height: 100,
  },
  details: {
    flex: 1,
  },
  tutorName: {
    fontSize: 14,
    fontWeight: "900",
    color: PAL.PURE_WHITE,
  },
  rating: {
    fontSize: 12,
    color: PAL.SUNSET_ORANGE,
    fontWeight: "700",
    marginTop: 4,
  },
  status: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    marginTop: 8,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: PAL.GREEN,
  },
  etaText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    marginTop: 6,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  callBtn: {
    flex: 1,
    backgroundColor: PAL.GREEN,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  callBtnText: {
    color: PAL.PURE_WHITE,
    fontWeight: "900",
    fontSize: 12,
  },
  messageBtn: {
    flex: 1,
    backgroundColor: PAL.SUNSET_ORANGE,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  messageBtnText: {
    color: PAL.PRIMARY_NAVY,
    fontWeight: "900",
    fontSize: 12,
  },
});