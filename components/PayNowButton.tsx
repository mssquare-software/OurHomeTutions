import React, { useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";

export default function PayNowButton({
  title = "Pay",
  onPress,
  disabled,
  style,
}: {
  title?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const [pressed, setPressed] = useState(false);

  const iconColor = "#FFFFFF";

  const beforeTransform = useMemo(() => {
    return {
      transform: [
        {
          translateX: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [-260, 260],
          }),
        },
        {
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -20],
          }),
        },
      ],
    };
  }, [anim]);

  const play = () => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        setPressed(true);
        if (!disabled) play();
      }}
      onPressOut={() => setPressed(false)}
      style={({ pressed: p }) => [
        styles.btn,
        disabled ? { opacity: 0.5 } : null,
        (p || pressed) ? { transform: [{ translateX: 5 }, { translateY: 5 }] } : null,
        style,
      ]}
    >
      {/* circle layer */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.before,
          beforeTransform as any,
        ]}
      />

      {/* Optional subtle gradient to match dark button */}
      <LinearGradient
        colors={["#0f0f0f", "#0a0a0a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      />

      <Text style={styles.text}>{title}</Text>
      <Svg width={16} height={16} viewBox="0 0 576 512" style={styles.icon} accessible={false}>
        <Path
          d="M512 80c8.8 0 16 7.2 16 16v32H48V96c0-8.8 7.2-16 16-16H512zm16 144V416c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V224H528zM64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm56 304c-13.3 0-24 10.7-24 24s10.7 24 24 24h48c13.3 0 24-10.7 24-24s-10.7-24-24-24H120zm128 0c-13.3 0-24 10.7-24 24s10.7 24 24 24H360c13.3 0 24-10.7 24-24s-10.7-24-24-24H248z"
          fill={iconColor}
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 130,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgb(15,15,15)",
    borderWidth: 0,
    color: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 5, height: 5 },
    overflow: "hidden",
    flexDirection: "row",
    paddingHorizontal: 12,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
  },
  before: {
    position: "absolute",
    left: -100,
    top: 0,
    width: 130,
    height: 130,
    backgroundColor: "#FFFFFF",
    borderRadius: 65,
    opacity: 0.95,
    // On RN the mix-blend-mode is not consistently supported, but the visual effect still works.
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  icon: {
    marginLeft: 0,
  },
});

