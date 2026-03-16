import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "../constants/colors";

export default function PagerDots({ index, total }: { index: number; total: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 14 },
  dot: { width: 18, height: 4, borderRadius: 99, backgroundColor: "rgba(249,250,251,0.22)" },
  dotActive: { backgroundColor: Colors.brand.sunsetOrange },
});