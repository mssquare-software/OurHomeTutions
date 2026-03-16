import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

interface CircleLoaderProps {
  size?: number;
  message?: string;
}

export const CircleLoader: React.FC<CircleLoaderProps> = ({ 
  size = 100, 
  message = 'Loading...' 
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LottieView
        source={require('../../assets/animations/circle-loader.json')}
        autoPlay
        loop
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});