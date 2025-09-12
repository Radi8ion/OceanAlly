import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MyReportsScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>My Reports</Text>
      <Text>Here you’ll see submitted and offline reports (to be synced).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
});
