import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import AppButton from "../components/AppButton";
import PagerDots from "../components/PagerDots";
import { onboardingSlides } from "../constants/onboardingSlides";
import { useGlobalLoader } from "./context/LoadingOverlayContext";

const { width, height } = Dimensions.get("window");

export default function Landing() {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const { show } = useGlobalLoader();

  // Single scroll value to drive the parallax slide
  const scrollX = useRef(new Animated.Value(0)).current;

  const onContinue = () => {
    if (index < onboardingSlides.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      show();
      router.push("/(auth)/login");
    }
  };

  const onSkip = () => {
    show();
    router.push("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      {/* BEAUTIFUL PARALLAX BACKGROUND */}
      {onboardingSlides.map((slide, i) => {
        // This calculates the opacity and movement for each background image
        const opacity = scrollX.interpolate({
          inputRange: [(i - 1) * width, i * width, (i + 1) * width],
          outputRange: [0, 1, 0],
          extrapolate: "clamp",
        });

        return (
          <Animated.Image
            key={`bg-${i}`}
            source={slide.image}
            style={[styles.fullScreenImage, { opacity }]}
          />
        );
      })}

      <View style={styles.overlay} />

      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <Animated.FlatList
        ref={listRef}
        data={onboardingSlides}
        keyExtractor={(item: any) => item.title}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        // This connects the scroll position to our animation value
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(i);
        }}
        renderItem={({ item, index: i }: any) => {
          // Subtle horizontal slide for the text (Parallax effect)
          const translateX = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [100, 0, -100],
          });

          return (
            <View style={styles.slide}>
              <Animated.View style={[styles.textContainer, { transform: [{ translateX }] }]}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </Animated.View>
            </View>
          );
        }}
      />

      <View style={styles.ctaContainer}>
        <View style={styles.dotsWrapper}>
          <PagerDots index={index} total={onboardingSlides.length} />
        </View>

        <View style={styles.buttonWrapper}>
          <AppButton
            title={index === onboardingSlides.length - 1 ? "Let's go" : "Continue"}
            onPress={onContinue}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  fullScreenImage: {
    ...StyleSheet.absoluteFillObject,
    width: width,
    height: height,
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)", // Smooth dark overlay for luxury feel
  },
  header: {
    position: "absolute",
    top: 50,
    right: 24,
    zIndex: 10,
  },
  skipText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.8,
  },
  slide: {
    width: width,
    height: height,
    justifyContent: "flex-end",
    paddingBottom: 220,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#D1D5DB",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  ctaContainer: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    alignItems: "center",
  },
  dotsWrapper: {
    marginBottom: 24,
  },
  buttonWrapper: {
    width: "85%",
  },
});