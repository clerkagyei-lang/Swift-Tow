import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

interface Props {
  driverLocation: { latitude: number; longitude: number } | null;
  requestLocation: { latitude: number; longitude: number } | null;
  mapRef: React.RefObject<any>;
  colors: { primary: string; secondary: string; success: string };
}

const ACCRA = { lat: 5.6037, lng: -0.187 };

function loadLeaflet(): Promise<any> {
  return new Promise((resolve) => {
    const w = window as any;
    if (w.L) { resolve(w.L); return; }

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => resolve(w.L);
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (w.L) { clearInterval(interval); resolve(w.L); }
      }, 50);
    }
  });
}

export default function DriverMapComponent({ driverLocation, requestLocation, colors }: Props) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef2 = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = await loadLeaflet();
      if (cancelled || !divRef.current || mapRef2.current) return;

      const lat = driverLocation?.latitude ?? ACCRA.lat;
      const lng = driverLocation?.longitude ?? ACCRA.lng;

      const map = L.map(divRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // Driver truck marker
      const truckIcon = L.divIcon({
        html: `<div style="width:48px;height:48px;border-radius:50%;background:${colors.secondary};border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                   <path d="M20 8h-3L15 4H5c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM8 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm9 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-7V9.5h2.5l1.96 2.5H16z"/>
                 </svg>
               </div>`,
        className: "",
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      if (driverLocation) {
        driverMarkerRef.current = L.marker([lat, lng], { icon: truckIcon }).addTo(map);
      }

      mapRef2.current = map;

      // Trigger request marker if already set
      if (requestLocation) {
        updatePickup(L, map, requestLocation, driverLocation);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  function updatePickup(
    L: any, map: any,
    req: { latitude: number; longitude: number },
    drv: { latitude: number; longitude: number } | null
  ) {
    const pickupIcon = L.divIcon({
      html: `<div style="display:flex;flex-direction:column;align-items:center">
               <div style="width:14px;height:14px;border-radius:50%;background:${colors.primary};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>
               <div style="width:2px;height:10px;background:${colors.primary}"></div>
             </div>`,
      className: "",
      iconSize: [14, 24],
      iconAnchor: [7, 24],
    });

    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setLatLng([req.latitude, req.longitude]);
    } else {
      pickupMarkerRef.current = L.marker([req.latitude, req.longitude], { icon: pickupIcon }).addTo(map);
    }

    // Dashed route line
    if (drv) {
      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
      }
      routeLineRef.current = L.polyline(
        [[drv.latitude, drv.longitude], [req.latitude, req.longitude]],
        { color: colors.primary, weight: 3, dashArray: "8 6", opacity: 0.7 }
      ).addTo(map);

      const bounds = L.latLngBounds([
        [drv.latitude, drv.longitude],
        [req.latitude, req.longitude],
      ]);
      map.fitBounds(bounds, { padding: [80, 80], animate: true });
    } else {
      map.panTo([req.latitude, req.longitude], { animate: true });
    }
  }

  // Driver location updates
  useEffect(() => {
    const L = (window as any).L;
    const map = mapRef2.current;
    if (!L || !map || !driverLocation) return;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([driverLocation.latitude, driverLocation.longitude]);
    } else {
      const truckIcon = L.divIcon({
        html: `<div style="width:48px;height:48px;border-radius:50%;background:${colors.secondary};border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                   <path d="M20 8h-3L15 4H5c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM8 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-7V9.5h2.5l1.96 2.5H16z"/>
                 </svg>
               </div>`,
        className: "",
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });
      driverMarkerRef.current = L.marker([driverLocation.latitude, driverLocation.longitude], { icon: truckIcon }).addTo(map);
    }

    if (requestLocation) {
      if (routeLineRef.current) map.removeLayer(routeLineRef.current);
      routeLineRef.current = L.polyline(
        [[driverLocation.latitude, driverLocation.longitude], [requestLocation.latitude, requestLocation.longitude]],
        { color: colors.primary, weight: 3, dashArray: "8 6", opacity: 0.7 }
      ).addTo(map);
    } else {
      map.panTo([driverLocation.latitude, driverLocation.longitude], { animate: true });
    }
  }, [driverLocation]);

  // Request location updates
  useEffect(() => {
    const L = (window as any).L;
    const map = mapRef2.current;
    if (!L || !map) return;

    if (requestLocation) {
      updatePickup(L, map, requestLocation, driverLocation);
    } else if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current);
      pickupMarkerRef.current = null;
      if (routeLineRef.current) { map.removeLayer(routeLineRef.current); routeLineRef.current = null; }
    }
  }, [requestLocation]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <div
        ref={divRef}
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      />
    </View>
  );
}
