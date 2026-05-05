import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";

interface Props {
  driverLocation: { latitude: number; longitude: number } | null;
  requestLocation: { latitude: number; longitude: number } | null;
  mapRef: React.RefObject<any>;
  colors: { primary: string; secondary: string; success: string };
}

const ACCRA = { lat: 5.6037, lng: -0.187 };

export default function DriverMapComponent({ driverLocation, requestLocation, colors }: Props) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef2 = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const routeRequestRef = useRef<string>("");
  const [error, setError] = useState<string | null>(null);

  function makeTruckIcon(maps: typeof google.maps, bg: string) {
    return {
      url: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><circle cx='24' cy='24' r='24' fill='${encodeURIComponent(bg)}'/><path d='M34 18h-5l-2-6H13c-1.66 0-3 1.34-3 3v13h3c0 2.48 2.02 4.5 4.5 4.5S22 30.48 22 28h6c0 2.48 2.02 4.5 4.5 4.5S37 30.48 37 28h3v-6l-4-4h-2zm-15.5 12c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm14 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM33 23v-3.5h3.5l2.46 3.5H33z' fill='white'/></svg>`,
      scaledSize: new maps.Size(48, 48),
      anchor: new maps.Point(24, 24),
    };
  }

  function makePickupIcon(maps: typeof google.maps) {
    return {
      url: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='40' viewBox='0 0 32 40'><path d='M16 0C7.16 0 0 7.16 0 16c0 11 16 24 16 24S32 27 32 16C32 7.16 24.84 0 16 0z' fill='${encodeURIComponent(colors.primary)}'/><circle cx='16' cy='16' r='7' fill='white'/></svg>`,
      scaledSize: new maps.Size(32, 40),
      anchor: new maps.Point(16, 40),
    };
  }

  function requestRoute(
    maps: typeof google.maps,
    map: google.maps.Map,
    origin: google.maps.LatLngLiteral,
    destination: google.maps.LatLngLiteral
  ) {
    const key = `${origin.lat},${origin.lng}->${destination.lat},${destination.lng}`;
    if (routeRequestRef.current === key) return;
    routeRequestRef.current = key;

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
          strokeOpacity: 0.85,
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
          const leg = result.routes[0]?.legs[0];
          if (leg) {
            const bounds = new maps.LatLngBounds();
            bounds.extend(origin);
            bounds.extend(destination);
            map.fitBounds(bounds, 80);
          }
        } else {
          // Fallback: draw straight dashed line if Directions fails
          directionsRendererRef.current?.setMap(null);
          directionsRendererRef.current = null;
        }
      }
    );
  }

  function clearRoute() {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
    routeRequestRef.current = "";
  }

  // Initial map load
  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !divRef.current || mapRef2.current) return;

        const lat = driverLocation?.latitude ?? ACCRA.lat;
        const lng = driverLocation?.longitude ?? ACCRA.lng;

        const map = new maps.Map(divRef.current, {
          center: { lat, lng },
          zoom: 14,
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

        if (driverLocation) {
          driverMarkerRef.current = new maps.Marker({
            map,
            position: { lat, lng },
            icon: makeTruckIcon(maps, colors.secondary),
            title: "You",
            zIndex: 10,
          });
        }

        if (requestLocation) {
          const reqPos = { lat: requestLocation.latitude, lng: requestLocation.longitude };
          pickupMarkerRef.current = new maps.Marker({
            map,
            position: reqPos,
            icon: makePickupIcon(maps),
            title: "Pickup",
            zIndex: 9,
          });

          if (driverLocation) {
            requestRoute(maps, map, { lat, lng }, reqPos);
          } else {
            map.panTo(reqPos);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(String(err.message));
      });

    return () => { cancelled = true; };
  }, []);

  // Update driver position + route when driver moves
  useEffect(() => {
    const maps = (window as any).google?.maps as typeof google.maps | undefined;
    const map = mapRef2.current;
    if (!maps || !map || !driverLocation) return;

    const pos = { lat: driverLocation.latitude, lng: driverLocation.longitude };

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setPosition(pos);
    } else {
      driverMarkerRef.current = new maps.Marker({
        map,
        position: pos,
        icon: makeTruckIcon(maps, colors.secondary),
        title: "You",
        zIndex: 10,
      });
    }

    if (requestLocation) {
      const reqPos = { lat: requestLocation.latitude, lng: requestLocation.longitude };
      requestRoute(maps, map, pos, reqPos);
    } else {
      map.panTo(pos);
    }
  }, [driverLocation]);

  // Update pickup marker + route when request changes
  useEffect(() => {
    const maps = (window as any).google?.maps as typeof google.maps | undefined;
    const map = mapRef2.current;
    if (!maps || !map) return;

    if (requestLocation) {
      const reqPos = { lat: requestLocation.latitude, lng: requestLocation.longitude };

      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setPosition(reqPos);
      } else {
        pickupMarkerRef.current = new maps.Marker({
          map,
          position: reqPos,
          icon: makePickupIcon(maps),
          title: "Pickup",
          zIndex: 9,
        });
      }

      if (driverLocation) {
        const drvPos = { lat: driverLocation.latitude, lng: driverLocation.longitude };
        requestRoute(maps, map, drvPos, reqPos);
      } else {
        map.panTo(reqPos);
      }
    } else {
      pickupMarkerRef.current?.setMap(null);
      pickupMarkerRef.current = null;
      clearRoute();
    }
  }, [requestLocation]);

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
