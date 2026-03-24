import LottieView from "lottie-react-native";
import React from "react";
import { Modal, StyleSheet, View } from "react-native";

interface LoadingOverlayProps {
  visible: boolean;
  type?: "circle" | "compass" | "delivery";
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  type = "circle",
  message = "Loading...",
}) => {
  const getSource = () => {
    switch (type) {
      case "compass":
        return require("../../assets/animations/compass.json");
      case "delivery":
        return require("../../assets/animations/delivery-man-calling-customer.json");
      default:
        return require("../../assets/animations/circle-loader.json");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <View style={styles.content}>
          <LottieView
            source={getSource()}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: 150,
    height: 150,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  lottie: {
    width: 120,
    height: 120,
  },
});