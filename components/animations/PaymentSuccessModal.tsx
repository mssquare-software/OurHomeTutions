import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import LottieView from 'lottie-react-native';

interface PaymentSuccessModalProps {
  visible: boolean;
  onSuccess?: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  visible,
  onSuccess,
}) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onSuccess?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, onSuccess]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <LottieView
            source={require('../../assets/animations/success.json')}
            autoPlay
            loop={false}
            style={styles.animation}
          />
          <Text style={styles.title}>Payment Successful!</Text>
          <Text style={styles.subtitle}>Your booking is confirmed</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '80%',
  },
  animation: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(31,41,55,0.65)',
    textAlign: 'center',
  },
});