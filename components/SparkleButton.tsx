import React, { useMemo, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

type Bubble = {
  x: number; // px offset from center
  size: number; // px
  durationMs: number;
  delayMs: number;
};

export default function SparkleButton({
  title,
  onPress,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: any;
}) {
  const bubbleAnim = useRef(new Animated.Value(0)).current;

  const bubblesTop: Bubble[] = useMemo(
    () => [
      { x: -52, size: 10, durationMs: 600, delayMs: 0 },
      { x: -28, size: 18, durationMs: 600, delayMs: 60 },
      { x: -8, size: 12, durationMs: 600, delayMs: 30 },
      { x: 14, size: 20, durationMs: 600, delayMs: 90 },
      { x: 34, size: 14, durationMs: 600, delayMs: 40 },
      { x: 52, size: 16, durationMs: 600, delayMs: 80 },
    ],
    []
  );

  const bubblesBottom: Bubble[] = useMemo(
    () => [
      { x: -48, size: 18, durationMs: 600, delayMs: 0 },
      { x: -26, size: 12, durationMs: 600, delayMs: 60 },
      { x: -6, size: 22, durationMs: 600, delayMs: 30 },
      { x: 12, size: 14, durationMs: 600, delayMs: 90 },
      { x: 30, size: 18, durationMs: 600, delayMs: 40 },
      { x: 48, size: 12, durationMs: 600, delayMs: 80 },
    ],
    []
  );

  const play = () => {
    bubbleAnim.setValue(0);
    Animated.timing(bubbleAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const bubbleOpacity = bubbleAnim.interpolate({
    inputRange: [0, 0.15, 1],
    outputRange: [0, 1, 0],
    extrapolate: "clamp",
  });

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => play()}
      style={({ pressed }) => [
        styles.outer,
        disabled ? { opacity: 0.55 } : null,
        pressed ? { transform: [{ scale: 0.98 }] } : null,
        style,
      ]}
    >
      <View style={styles.button}>
        <Text style={styles.text}>{title}</Text>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.topLayer,
            {
              opacity: bubbleOpacity,
              transform: [
                {
                  translateY: bubbleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -70],
                  }),
                },
              ],
            },
          ]}
        >
          {bubblesTop.map((b, idx) => (
            <View
              // eslint-disable-next-line react/no-array-index-key
              key={`top-${idx}`}
              style={[
                styles.bubble,
                {
                  left: "50%",
                  width: b.size,
                  height: b.size,
                  marginLeft: b.x - b.size / 2,
                  backgroundColor: "#ff7f50",
                  borderRadius: b.size / 2,
                  transform: [
                    {
                      scale: bubbleAnim.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.4, 1, 0.6],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.bottomLayer,
            {
              opacity: bubbleOpacity,
              transform: [
                {
                  translateY: bubbleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 70],
                  }),
                },
              ],
            },
          ]}
        >
          {bubblesBottom.map((b, idx) => (
            <View
              // eslint-disable-next-line react/no-array-index-key
              key={`bot-${idx}`}
              style={[
                styles.bubble,
                {
                  left: "50%",
                  width: b.size,
                  height: b.size,
                  marginLeft: b.x - b.size / 2,
                  backgroundColor: "#ff7f50",
                  borderRadius: b.size / 2,
                  transform: [
                    {
                      scale: bubbleAnim.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.4, 1, 0.6],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    height: 48,
    borderRadius: 14,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff7f50",
    overflow: "hidden",
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.2,
    paddingHorizontal: 14,
  },
  topLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 6,
    height: 30,
  },
  bottomLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 6,
    height: 30,
  },
  bubble: {
    position: "absolute",
    top: 0,
  },
});

