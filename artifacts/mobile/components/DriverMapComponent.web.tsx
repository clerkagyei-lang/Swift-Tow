import Constants from "expo-constants";
import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

interface Props {
  driverLocation: { latitude: number; longitude: number } | null;
  requestLocation: { latitude: number; longitude: number } | null;
  mapRef: React.RefObject<any>;
  colors: { primary: string; secondary: string; success: string };
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

export default function DriverMapComponent({ driverLocation, requestLocation, colors }: Props) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef2 = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const routeLineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const maps = await loadGoogleMaps();
      if (cancelled || !divRef.current || mapRef2.current) return;

      const lat = driverLocation?.latitude ?? ACCRA.lat;
      const lng = driverLocation?.longitude ?? ACCRA.lng;

      const map = new maps.Map(divRef.current, {
        center: { lat, lng },
        zoom: 14,
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

      if (driverLocation) {
        driverMarkerRef.current = new maps.Marker({
          map,
          position: { lat, lng },
          icon: makeTruckIcon(maps, colors.secondary),
          title: "You",
        });
      }

      if (requestLocation) {
        updatePickup(maps, map, requestLocation, driverLocation);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  function makeTruckIcon(maps: typeof google.maps, bg: string) {
    return {
      url: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><circle cx='24' cy='24' r='24' fill='${encodeURIComponent(bg)}'/><path d='M34 18h-5l-2-6H13c-1.66 0-3 1.34-3 3v13h3c0 2.48 2.02 4.5 4.5 4.5S22 30.48 22 28h6c0 2.48 2.02 4.5 4.5 4.5S37 30.48 37 28h3v-6l-4-4h-2zm-15.5 12c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm14 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM33 23v-3.5h3.5l2.46 3.5H33z' fill='white'/></svg>`,
      scaledSize: new maps.Size(48, 48),
      anchor: new maps.Point(24, 24),
    };
  }

  function updatePickup(
    maps: typeof google.maps,
    map: google.maps.Map,
    req: { latitude: number; longitude: number },
    drv: { latitude: number; longitude: number } | null
  ) {
    const reqPos = { lat: req.latitude, lng: req.longitude };

    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setPosition(reqPos);
    } else {
      pickupMarkerRef.current = new maps.Marker({
        map,
        position: reqPos,
        icon: {
          url: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='40' viewBox='0 0 32 40'><path d='M16 0C7.16 0 0 7.16 0 16c0 11 16 24 16 24S32 27 32 16C32 7.16 24.84 0 16 0z' fill='${encodeURIComponent(colors.primary)}'/><circle cx='16' cy='16' r='7' fill='white'/></svg>`,
          scaledSize: new maps.Size(32, 40),
          anchor: new maps.Point(16, 40),
        },
        title: "Pickup",
      });
    }

    if (drv) {
      const drvPos = { lat: drv.latitude, lng: drv.longitude };
      routeLineRef.current?.setMap(null);
      routeLineRef.current = new maps.Polyline({
        map,
        path: [drvPos, reqPos],
        strokeColor: colors.primary,
        strokeOpacity: 0,
        icons: [{
          icon: { path: "M 0,-1 0,1", strokeOpacity: 0.8, scale: 3 },
          offset: "0",
          repeat: "16px",
        }],
        strokeWeight: 3,
      });

      const bounds = new maps.LatLngBounds();
      bounds.extend(drvPos);
      bounds.extend(reqPos);
      map.fitBounds(bounds, 80);
    } else {
      map.panTo(reqPos);
    }
  }

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
      });
    }

    if (requestLocation) {
      routeLineRef.current?.setMap(null);
      routeLineRef.current = new maps.Polyline({
        map,
        path: [pos, { lat: requestLocation.latitude, lng: requestLocation.longitude }],
        strokeColor: colors.primary,
        strokeOpacity: 0,
        icons: [{
          icon: { path: "M 0,-1 0,1", strokeOpacity: 0.8, scale: 3 },
          offset: "0",
          repeat: "16px",
        }],
        strokeWeight: 3,
      });
    } else {
      map.panTo(pos);
    }
  }, [driverLocation]);

  useEffect(() => {
    const maps = (window as any).google?.maps as typeof google.maps | undefined;
    const map = mapRef2.current;
    if (!maps || !map) return;

    if (requestLocation) {
      updatePickup(maps, map, requestLocation, driverLocation);
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setMap(null);
      pickupMarkerRef.current = null;
      routeLineRef.current?.setMap(null);
      routeLineRef.current = null;
    }
  }, [requestLocation]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <div ref={divRef} style={{ position: "absolute", inset: 0 }} />
    </View>
  );
}
