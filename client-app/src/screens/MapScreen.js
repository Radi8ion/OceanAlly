import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MapScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Map Dashboard</Text>
      <Text>Interactive hazard map will be integrated here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
});
