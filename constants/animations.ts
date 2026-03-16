export const ANIMATION_TIMING = {
  FAST: 300,
  NORMAL: 500,
  SLOW: 800,
  SPLASH: 2000,
};

export const SPRING_CONFIG = {
  damping: 10,
  mass: 1,
  stiffness: 100,
  overshootClamping: false,
  restSpeedThreshold: 2,
  restDisplacementThreshold: 2,
};

export const EASING = {
  easeInOut: [0.25, 0.1, 0.25, 1],
  easeOut: [0.33, 1, 0.68, 1],
  easeIn: [0.42, 0, 1, 1],
};

export const LOADER_CONFIGS = {
  CIRCLE: {
    speed: 1,
    size: 60,
  },
  COMPASS: {
    speed: 1.2,
    size: 80,
  },
  DELIVERY: {
    speed: 1,
    size: 100,
  },
};