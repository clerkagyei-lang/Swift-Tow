import Constants from "expo-constants";
import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

interface Props {
  location: { latitude: number; longitude: number } | null;
  driverLocation: { latitude: number; longitude: number } | null;
  mapRef: React.RefObject<any>;
  colors: { primary: string; secondary: string };
  followUser?: boolean;
}

const ACCRA = { lat: 5.6037, lng: -0.187 };
const GMAPS_KEY = (Constants.expoConfig?.extra?.googleMapsKey as string | undefined) ?? "";

function loadGoogleMaps(): Promise<typeof google.maps> {
  return new Promise((resolve) => {
    const w = window as any;
    if (w.google?.maps) { resolve(w.google.maps); return; }
    if (document.getElementById("gmaps-js")) {
      const interval = setInterval(() => {
        if (w.google?.maps) { clearInterval(interval); resolve(w.google.maps); }
      }, 50);
      return;
    }
    (w as any).__gmapsResolve = () => resolve(w.google.maps);
    const script = document.createElement("script");
    script.id = "gmaps-js";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&loading=async&callback=__gmapsResolve`;
    script.async = true;
    document.head.appendChild(script);
  });
}

export default function MapComponent({ location, driverLocation, colors }: Props) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef2 = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const maps = await loadGoogleMaps();
      if (cancelled || !divRef.current || mapRef2.current) return;

      const lat = location?.latitude ?? ACCRA.lat;
      const lng = location?.longitude ?? ACCRA.lng;

      const map = new maps.Map(divRef.current, {
        center: { lat, lng },
        zoom: 15,
        disableDefaultUI: false,
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
      });

      if (driverLocation) {
        placeDriverMarker(maps, map, driverLocation, { latitude: lat, longitude: lng });
      }
    })();

    return () => { cancelled = true; };
  }, []);

  function placeDriverMarker(
    maps: typeof google.maps,
    map: google.maps.Map,
    dl: { latitude: number; longitude: number },
    ul: { latitude: number; longitude: number } | null
  ) {
    const pos = { lat: dl.latitude, lng: dl.longitude };
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setPosition(pos);
    } else {
      driverMarkerRef.current = new maps.Marker({
        map,
        position: pos,
        icon: {
          url: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'><circle cx='22' cy='22' r='22' fill='${encodeURIComponent(colors.secondary)}'/><path d='M32 16h-5L25 10H11c-1.66 0-3 1.34-3 3v13h3c0 2.48 2.02 4.5 4.5 4.5S20 28.48 20 26h6c0 2.48 2.02 4.5 4.5 4.5S35 28.48 35 26h3v-6l-4-4h-2zm-15.5 12c-.83 0-1.5-.67-1.5-1.5S15.67 25 16.5 25s1.5.67 1.5 1.5S17.33 28 16.5 28zm14 0c-.83 0-1.5-.67-1.5-1.5S29.67 25 30.5 25s1.5.67 1.5 1.5S31.33 28 30.5 28zm-1.5-8v-3.5h3.5l2.46 3.5H29z' fill='white'/></svg>`,
          scaledSize: new maps.Size(44, 44),
          anchor: new maps.Point(22, 22),
        },
        title: "Your Driver",
      });
    }

    if (ul) {
      const bounds = new maps.LatLngBounds();
      bounds.extend({ lat: ul.latitude, lng: ul.longitude });
      bounds.extend(pos);
      map.fitBounds(bounds, 80);
    }
  }

  useEffect(() => {
    const maps = (window as any).google?.maps as typeof google.maps | undefined;
    const map = mapRef2.current;
    if (!maps || !map || !location) return;
    const pos = { lat: location.latitude, lng: location.longitude };
    userMarkerRef.current?.setPosition(pos);
    circleRef.current?.setCenter(pos);
    if (!driverLocation) map.panTo(pos);
  }, [location]);

  useEffect(() => {
    const maps = (window as any).google?.maps as typeof google.maps | undefined;
    const map = mapRef2.current;
    if (!maps || !map) return;

    if (driverLocation) {
      placeDriverMarker(maps, map, driverLocation, location);
    } else if (driverMarkerRef.current) {
      driverMarkerRef.current.setMap(null);
      driverMarkerRef.current = null;
      if (location) map.panTo({ lat: location.latitude, lng: location.longitude });
    }
  }, [driverLocation]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <div ref={divRef} style={{ position: "absolute", inset: 0 }} />
    </View>
  );
}
