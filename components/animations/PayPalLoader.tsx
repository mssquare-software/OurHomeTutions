import React from "react";
import { StyleSheet, View } from "react-native";
import LottieView from "lottie-react-native";

export const PayPalLoader: React.FC = () => {
  return (
    <View style={styles.container}>
      <LottieView
        source={require("../../assets/animations/paypal.json")}
        autoPlay
        loop
        style={styles.animation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  animation: {
    width: "100%",
    height: "100%",
  },
});

