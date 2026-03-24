import React from "react";
import { View } from "react-native";
import LottieView from "lottie-react-native";

interface LottieLoaderProps {
  type: "circle" | "compass" | "delivery" | "success";
  size?: number;
  speed?: number;
}

export const LottieLoader: React.FC<LottieLoaderProps> = ({
  type,
  size = 100,
  speed = 1,
}) => {
  const getSource = () => {
    switch (type) {
      case "circle":
        return require("../../assets/animations/circle-loader.json");
      case "compass":
        return require("../../assets/animations/compass.json");
      case "delivery":
        return require("../../assets/animations/delivery-man-calling-customer.json");
      case "success":
        return require("../../assets/animations/success.json");
      default:
        return require("../../assets/animations/circle-loader.json");
    }
  };

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <LottieView
        source={getSource()}
        autoPlay
        loop={type !== "success"}
        speed={speed}
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
};