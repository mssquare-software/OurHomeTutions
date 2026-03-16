import React, { useEffect } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTour } from './useTour';

const PAL = {
  PRIMARY_NAVY: '#1B2A5A',
  DARK_SLATE: '#0F172A',
  SUNSET_ORANGE: '#ffb76c',
  CORAL: '#FF7F50',
  PURE_WHITE: '#FFFFFF',
};

export const AnimatedTourOverlay: React.FC = () => {
  const {
    isActive,
    currentStep,
    getCurrentConfig,
    getCurrentStep,
    getAnimationType,
    nextStep,
    previousStep,
    skipTour,
  } = useTour();

  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const translateYAnim = React.useRef(new Animated.Value(50)).current;

  const config = getCurrentConfig();
  const step = getCurrentStep();
  const animationType = getAnimationType();

  useEffect(() => {
    if (isActive && step) {
      playAnimation();
    }
  }, [isActive, currentStep, step, animationType]);

  const playAnimation = () => {
    switch (animationType) {
      case 'popup':
        playPopupAnimation();
        break;
      case 'slideUp':
        playSlideUpAnimation();
        break;
      case 'slideDown':
        playSlideDownAnimation();
        break;
      default:
        playPopupAnimation();
    }
  };

  const playPopupAnimation = () => {
    scaleAnim.setValue(0.8);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const playSlideUpAnimation = () => {
    translateYAnim.setValue(100);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const playSlideDownAnimation = () => {
    translateYAnim.setValue(-100);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (!isActive || !step || !config) return null;

  const { width, height } = Dimensions.get('window');

  let tooltipTop = height / 2 - 140;
  let tooltipLeft = Math.max(10, width / 2 - 150);

  if (tooltipLeft + 300 > width) {
    tooltipLeft = width - 310;
  }

  const getAnimatedStyle = () => {
    const baseStyle = {
      opacity: opacityAnim,
      top: tooltipTop,
      left: tooltipLeft,
    };

    switch (animationType) {
      case 'popup':
        return {
          ...baseStyle,
          transform: [
            { scale: scaleAnim },
            {
              translateY: scaleAnim.interpolate({
                inputRange: [0.8, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        };
      case 'slideUp':
      case 'slideDown':
        return {
          ...baseStyle,
          transform: [{ translateY: translateYAnim }],
        };
      default:
        return baseStyle;
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Dark overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: opacityAnim,
          },
        ]}
      />

      {/* Tooltip */}
      <Animated.View style={[styles.tooltip, getAnimatedStyle()]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.stepCounter}>
              Step {currentStep + 1} of {config.steps.length}
            </Text>
          </View>
          <Pressable onPress={skipTour} hitSlop={10}>
            <Text style={styles.closeBtn}>✕</Text>
          </Pressable>
        </View>

        <Text style={styles.description}>{step.description}</Text>

        <View style={styles.footer}>
          {currentStep > 0 && (
            <Pressable style={styles.backBtn} onPress={previousStep}>
              <Text style={styles.backBtnText}>← Back</Text>
            </Pressable>
          )}

          <Pressable
            style={[
              styles.nextBtn,
              currentStep === config.steps.length - 1 && styles.finishBtn,
              currentStep === 0 && styles.nextBtnFullWidth,
            ]}
            onPress={nextStep}
          >
            <Text style={styles.nextBtnText}>
              {currentStep === config.steps.length - 1 ? 'Finish' : 'Next →'}
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={skipTour} style={styles.skipLink}>
          <Text style={styles.skipText}>Skip tour</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: PAL.PURE_WHITE,
    borderRadius: 20,
    padding: 18,
    width: 300,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    color: PAL.DARK_SLATE,
    fontSize: 17,
    fontWeight: '900',
    marginRight: 10,
  },
  stepCounter: {
    color: PAL.SUNSET_ORANGE,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
  },
  closeBtn: {
    color: 'rgba(31,41,55,0.5)',
    fontSize: 22,
    fontWeight: '900',
  },
  description: {
    color: 'rgba(31,41,55,0.80)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  backBtn: {
    flex: 0.4,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PAL.SUNSET_ORANGE,
    alignItems: 'center',
  },
  backBtnText: {
    color: PAL.SUNSET_ORANGE,
    fontWeight: '900',
    fontSize: 13,
  },
  nextBtn: {
    flex: 0.6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: PAL.PRIMARY_NAVY,
    alignItems: 'center',
  },
  nextBtnFullWidth: {
    flex: 1,
  },
  finishBtn: {
    backgroundColor: PAL.SUNSET_ORANGE,
  },
  nextBtnText: {
    color: PAL.PURE_WHITE,
    fontWeight: '900',
    fontSize: 13,
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    color: 'rgba(31,41,55,0.50)',
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});