import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  location: { latitude: number; longitude: number } | null;
  mapRef: React.RefObject<MapView>;
  colors: { primary: string };
}

const ACCRA = { latitude: 5.6037, longitude: -0.187, latitudeDelta: 0.05, longitudeDelta: 0.05 };

export default function MapComponent({ location, mapRef, colors }: Props) {
  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_DEFAULT}
      initialRegion={location ? { ...location, latitudeDelta: 0.02, longitudeDelta: 0.02 } : ACCRA}
      showsUserLocation
      showsMyLocationButton={false}
    >
      {location && (
        <Marker coordinate={location} title="Your location">
          <View style={styles(colors).markerPin}>
            <Ionicons name="location" size={24} color="#FFFFFF" />
          </View>
        </Marker>
      )}
    </MapView>
  );
}

const styles = (colors: { primary: string }) =>
  StyleSheet.create({
    markerPin: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
  });
