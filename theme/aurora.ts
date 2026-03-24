export const AuroraTheme = {
  name: "Aurora Modern",
  colors: {
    surface: {
      background: "#F8FAFC",
      card: "#FFFFFF",
      cardHover: "#F1F5F9",
    },
    text: {
      primary: "#0F172A",
      secondary: "#475569",
      tertiary: "#94A3B8",
      onDark: "#FFFFFF",
    },
    brand: {
      primary: {
        base: "#6366F1",
        hover: "#4F46E5",
        active: "#4338CA",
      },
      sparkle: {
        gradient:
          "linear-gradient(135deg, #00C6FF 0%, #0072FF 50%, #9D50BB 100%)",
        glow: "rgba(0, 114, 255, 0.4)",
      },
    },
    border: {
      light: "#E2E8F0",
      focus: "#6366F1",
    },
  },
  typography: {
    fontFamily: {
      heading: "'Plus Jakarta Sans', 'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
    scale: {
      h1: {
        size: 40, // 2.5rem
        weight: "800",
        lineHeight: 1.2,
        letterSpacing: -0.02,
      },
      h2: {
        size: 30, // 1.875rem
        weight: "700",
        lineHeight: 1.3,
        letterSpacing: -0.01,
      },
      h3: {
        size: 20, // 1.25rem
        weight: "600",
        lineHeight: 1.4,
        letterSpacing: 0,
      },
      bodyLarge: {
        size: 18,
        weight: "400",
        lineHeight: 1.6,
      },
      bodyBase: {
        size: 16,
        weight: "400",
        lineHeight: 1.5,
      },
      button: {
        size: 15,
        weight: "600",
        lineHeight: 1,
        letterSpacing: 0.01,
      },
      caption: {
        size: 12,
        weight: "500",
        lineHeight: 1.4,
        letterSpacing: 0.03,
      },
    },
  },
  shape: {
    borderRadius: {
      sm: 6,
      md: 12,
      lg: 20,
      card: 24,
      button: 8,
      pill: 9999,
    },
  },
  shadows: {
    cardSm: "0 2px 4px -1px rgba(15, 23, 42, 0.06)",
    cardLg: "0 10px 25px -5px rgba(15, 23, 42, 0.08)",
    sparkleHover: "0 12px 24px -8px rgba(0, 114, 255, 0.5)",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    "2xl": 48,
  },
} as const;

