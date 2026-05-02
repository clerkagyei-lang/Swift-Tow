import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  location: { latitude: number; longitude: number } | null;
  mapRef: React.RefObject<any>;
  colors: { primary: string };
}

export default function MapComponent({ colors }: Props) {
  return (
    <View style={styles(colors).container}>
      <Ionicons name="map" size={64} color="rgba(255,107,0,0.25)" />
      <Text style={styles(colors).text}>Accra, Greater Accra, Ghana</Text>
    </View>
  );
}

const styles = (colors: { primary: string }) =>
  StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "#E8EFF8",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    text: { fontSize: 16, color: "#6C757D", fontWeight: "500" as const },
  });
