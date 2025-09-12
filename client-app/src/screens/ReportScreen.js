import React, { useState } from "react";
import { View, Text, TextInput, Button, Image, StyleSheet, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import useLocation from "../hooks/useLocation";

export default function ReportScreen() {
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const { location, getLocation } = useLocation();

  // Pick image or video
  const pickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    alert(
      `Report Submitted!\nDescription: ${description}\nImage: ${image ? "Attached" : "None"}\nLocation: ${
        location ? `${location.latitude}, ${location.longitude}` : "Not selected"
      }`
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Hazard Reporting</Text>

      <TextInput
        style={styles.input}
        placeholder="Describe the hazard..."
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Button title="Pick Photo/Video" onPress={pickMedia} />
      {image && <Image source={{ uri: image }} style={styles.preview} />}

      <Button title="Get Location" onPress={getLocation} />
      {location && (
        <Text style={styles.location}>
          📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </Text>
      )}

      <Button title="Submit Report" onPress={handleSubmit} color="#007AFF" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
    minHeight: 80,
    textAlignVertical: "top",
  },
  preview: { width: "100%", height: 200, marginVertical: 10, borderRadius: 8 },
  location: { marginVertical: 10, fontStyle: "italic" },
});
