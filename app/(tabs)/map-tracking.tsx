import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { CompassLoader } from '@/components/animations/CompassLoader';
import { DeliveryManAnimation } from '@/components/animations/DeliveryManAnimation';

export default function MapTrackingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.mapArea}>
        <CompassLoader />
      </View>
      
      <View style={styles.deliveryArea}>
        <Text style={styles.title}>Your Tutor is on the way</Text>
        <DeliveryManAnimation />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  mapArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  deliveryArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 20,
  },
});