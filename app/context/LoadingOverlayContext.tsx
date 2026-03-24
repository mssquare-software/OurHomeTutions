import LottieView from "lottie-react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Modal, StyleSheet, View } from "react-native";

type LoadingContextValue = {
  show: (durationMs?: number) => void;
};

const LoadingOverlayContext = createContext<LoadingContextValue | undefined>(
  undefined,
);

export const useGlobalLoader = (): LoadingContextValue => {
  const ctx = useContext(LoadingOverlayContext);
  if (!ctx) {
    throw new Error("useGlobalLoader must be used within LoadingOverlayProvider");
  }
  return ctx;
};

type Props = {
  children: React.ReactNode;
};

export function LoadingOverlayProvider({ children }: Props) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((durationMs: number = 900) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setVisible(true);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      timerRef.current = null;
    }, durationMs);
  }, []);

  return (
    <LoadingOverlayContext.Provider value={{ show }}>
      {children}
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <LottieView
              source={require("../../assets/animations/circle-loader.json")}
              autoPlay
              loop
              style={styles.animation}
            />
          </View>
        </View>
      </Modal>
    </LoadingOverlayContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: 160,
    height: 160,
    borderRadius: 24,
    backgroundColor: "rgba(15,23,42,0.95)",
    borderWidth: 1,
    borderColor: "rgba(249,250,251,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  animation: {
    width: 120,
    height: 120,
  },
});

