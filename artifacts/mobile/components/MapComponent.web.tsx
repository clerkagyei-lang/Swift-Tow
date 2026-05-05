import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";

interface Props {
  location: { latitude: number; longitude: number } | null;
  driverLocation: { latitude: number; longitude: number } | null;
  mapRef: React.RefObject<any>;
  colors: { primary: string; secondary: string };
  followUser?: boolean;
}

const ACCRA = { lat: 5.6037, lng: -0.187 };

export default function MapComponent({ location, driverLocation, colors }: Props) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef2 = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const routeKeyRef = useRef<string>("");
  const [error, setError] = useState<string | null>(null);

  function makeDriverIcon(maps: typeof google.maps) {
    return {
      url: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'><circle cx='22' cy='22' r='22' fill='${encodeURIComponent(colors.secondary)}'/><path d='M32 16h-5L25 10H11c-1.66 0-3 1.34-3 3v13h3c0 2.48 2.02 4.5 4.5 4.5S20 28.48 20 26h6c0 2.48 2.02 4.5 4.5 4.5S35 28.48 35 26h3v-6l-4-4h-2zm-15.5 12c-.83 0-1.5-.67-1.5-1.5S15.67 25 16.5 25s1.5.67 1.5 1.5S17.33 28 16.5 28zm14 0c-.83 0-1.5-.67-1.5-1.5S29.67 25 30.5 25s1.5.67 1.5 1.5S31.33 28 30.5 28zm-1.5-8V9.5h2.5l1.96 2.5H29z' fill='white'/></svg>`,
      scaledSize: new maps.Size(44, 44),
      anchor: new maps.Point(22, 22),
    };
  }

  function requestRoute(
    maps: typeof google.maps,
    map: google.maps.Map,
    origin: google.maps.LatLngLiteral,
    destination: google.maps.LatLngLiteral
  ) {
    const key = `${origin.lat},${origin.lng}->${destination.lat},${destination.lng}`;
    if (routeKeyRef.current === key) return;
    routeKeyRef.current = key;

    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new maps.DirectionsService();
    }
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: colors.primary,
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      });
    }

    directionsServiceRef.current.route(
      {
        origin,
        destination,
        travelMode: maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === maps.DirectionsStatus.OK && result) {
          directionsRendererRef.current?.setDirections(result);
          const bounds = new maps.LatLngBounds();
          bounds.extend(origin);
          bounds.extend(destination);
          map.fitBounds(bounds, 80);
        } else {
          directionsRendererRef.current?.setMap(null);
          directionsRendererRef.current = null;
          // Fallback: fit bounds without route
          const bounds = new maps.LatLngBounds();
          bounds.extend(origin);
          bounds.extend(destination);
          map.fitBounds(bounds, 80);
        }
      }
    );
  }

  function clearRoute(map: google.maps.Map | null) {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
    routeKeyRef.current = "";
    if (map && location) {
      map.panTo({ lat: location.latitude, lng: location.longitude });
    }
  }

  // Initial map load
  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !divRef.current || mapRef2.current) return;

        const lat = location?.latitude ?? ACCRA.lat;
        const lng = location?.longitude ?? ACCRA.lng;

        const map = new maps.Map(divRef.current, {
          center: { lat, lng },
          zoom: 15,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "simplified" }] },
          ],
        });
        mapRef2.current = map;

        circleRef.current = new maps.Circle({
          map,
          center: { lat, lng },
          radius: 80,
          strokeColor: colors.primary,
          strokeOpacity: 0.5,
          strokeWeight: 2,
          fillColor: colors.primary,
          fillOpacity: 0.12,
        });

        userMarkerRef.current = new maps.Marker({
          map,
          position: { lat, lng },
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: "#4A90E2",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 3,
          },
          title: "Your location",
          zIndex: 10,
        });

        if (driverLocation) {
          const dPos = { lat: driverLocation.latitude, lng: driverLocation.longitude };
          driverMarkerRef.current = new maps.Marker({
            map,
            position: dPos,
            icon: makeDriverIcon(maps),
            title: "Your Driver",
            zIndex: 9,
          });
          requestRoute(maps, map, dPos, { lat, lng });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(String(err.message));
      });

    return () => { cancelled = true; };
  }, []);

  // Follow user location
  useEffect(() => {
    const maps = (window as any).google?.maps as typeof google.maps | undefined;
    const map = mapRef2.current;
    if (!maps || !map || !location) return;

    const pos = { lat: location.latitude, lng: location.longitude };
    userMarkerRef.current?.setPosition(pos);
    circleRef.current?.setCenter(pos);

    if (!driverLocation) map.panTo(pos);
  }, [location]);

  // Update driver marker + route
  useEffect(() => {
    const maps = (window as any).google?.maps as typeof google.maps | undefined;
    const map = mapRef2.current;
    if (!maps || !map) return;

    if (driverLocation) {
      const dPos = { lat: driverLocation.latitude, lng: driverLocation.longitude };

      if (driverMarkerRef.current) {
        driverMarkerRef.current.setPosition(dPos);
      } else {
        driverMarkerRef.current = new maps.Marker({
          map,
          position: dPos,
          icon: makeDriverIcon(maps),
          title: "Your Driver",
          zIndex: 9,
        });
      }

      if (location) {
        requestRoute(maps, map, dPos, { lat: location.latitude, lng: location.longitude });
      }
    } else {
      driverMarkerRef.current?.setMap(null);
      driverMarkerRef.current = null;
      clearRoute(map);
    }
  }, [driverLocation]);

  if (error) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.errorBox]}>
        <Text style={styles.errorText}>Map unavailable</Text>
        <Text style={styles.errorSub}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <div ref={divRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  errorBox: { backgroundColor: "#f0f0f0", alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 4 },
  errorSub: { fontSize: 12, color: "#666", textAlign: "center" },
});
