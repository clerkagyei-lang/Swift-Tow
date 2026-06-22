import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

interface Props {
  location: { latitude: number; longitude: number } | null;
  dropoffLocation?: { latitude: number; longitude: number } | null;
  driverLocation: { latitude: number; longitude: number } | null;
  mapRef: React.RefObject<any>;
  colors: { primary: string; secondary: string };
  followUser?: boolean;
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

export default function MapComponent({ location, dropoffLocation, driverLocation, colors }: Props) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef2 = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const dropoffMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const driverRouteLineRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = await loadLeaflet();
      if (cancelled || !divRef.current || mapRef2.current) return;

      const lat = location?.latitude ?? ACCRA.lat;
      const lng = location?.longitude ?? ACCRA.lng;

      const map = L.map(divRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      circleRef.current = L.circle([lat, lng], {
        radius: 80,
        color: colors.primary,
        fillColor: colors.primary,
        fillOpacity: 0.15,
        weight: 2,
        opacity: 0.5,
      }).addTo(map);

      const userIcon = L.divIcon({
        html: `<div style="width:18px;height:18px;border-radius:50%;background:#4A90E2;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
        className: "",
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      userMarkerRef.current = L.marker([lat, lng], { icon: userIcon }).addTo(map);
      mapRef2.current = map;

      if (driverLocation) {
        addOrMoveDriver(L, map, driverLocation, location);
      }
      if (dropoffLocation) {
        addOrMoveDropoff(L, map, dropoffLocation, location);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  function makeDropoffIcon(L: any) {
    return L.divIcon({
      html: `<div style="display:flex;flex-direction:column;align-items:center">
               <div style="width:28px;height:28px;border-radius:50%;background:${colors.primary};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
               </div>
               <div style="width:2px;height:10px;background:${colors.primary};opacity:0.7"></div>
             </div>`,
      className: "",
      iconSize: [28, 40],
      iconAnchor: [14, 40],
    });
  }

  function addOrMoveDropoff(
    L: any,
    map: any,
    dl: { latitude: number; longitude: number },
    ul: { latitude: number; longitude: number } | null
  ) {
    if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.setLatLng([dl.latitude, dl.longitude]);
    } else {
      dropoffMarkerRef.current = L.marker([dl.latitude, dl.longitude], {
        icon: makeDropoffIcon(L),
      }).addTo(map);
    }

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
    }
    if (ul) {
      routeLineRef.current = L.polyline(
        [[ul.latitude, ul.longitude], [dl.latitude, dl.longitude]],
        { color: colors.primary, weight: 3, opacity: 0.6, dashArray: "8 6" }
      ).addTo(map);

      const bounds = L.latLngBounds([
        [ul.latitude, ul.longitude],
        [dl.latitude, dl.longitude],
      ]);
      map.fitBounds(bounds, { padding: [80, 80], animate: true });
    }
  }

  function addOrMoveDriver(
    L: any,
    map: any,
    dl: { latitude: number; longitude: number },
    ul: { latitude: number; longitude: number } | null
  ) {
    const driverIcon = L.divIcon({
      html: `<div style="width:44px;height:44px;border-radius:50%;background:${colors.secondary};border:3px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center">
               <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="white">
                 <path d="M20 8h-3L15 4H5c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM8 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm9 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-7V9.5h2.5l1.96 2.5H16z"/>
               </svg>
             </div>`,
      className: "",
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([dl.latitude, dl.longitude]);
    } else {
      driverMarkerRef.current = L.marker([dl.latitude, dl.longitude], { icon: driverIcon }).addTo(map);
    }

    // Draw / update live route line from driver to user pickup
    if (ul) {
      if (driverRouteLineRef.current) {
        driverRouteLineRef.current.setLatLngs([
          [dl.latitude, dl.longitude],
          [ul.latitude, ul.longitude],
        ]);
      } else {
        driverRouteLineRef.current = L.polyline(
          [[dl.latitude, dl.longitude], [ul.latitude, ul.longitude]],
          { color: colors.primary, weight: 4, opacity: 0.75, dashArray: "10 7" }
        ).addTo(map);
      }

      const bounds = L.latLngBounds([
        [ul.latitude, ul.longitude],
        [dl.latitude, dl.longitude],
      ]);
      map.fitBounds(bounds, { padding: [70, 70], animate: true });
    }
  }

  useEffect(() => {
    const L = (window as any).L;
    const map = mapRef2.current;
    if (!L || !map || !location) return;
    const { latitude: lat, longitude: lng } = location;
    userMarkerRef.current?.setLatLng([lat, lng]);
    circleRef.current?.setLatLng([lat, lng]);
    if (!driverLocation && !dropoffLocation) {
      map.panTo([lat, lng], { animate: true, duration: 0.8 });
    }
    if (dropoffLocation) {
      addOrMoveDropoff(L, map, dropoffLocation, location);
    }
  }, [location]);

  useEffect(() => {
    const L = (window as any).L;
    const map = mapRef2.current;
    if (!L || !map) return;

    if (dropoffLocation) {
      addOrMoveDropoff(L, map, dropoffLocation, location);
    } else {
      if (dropoffMarkerRef.current) {
        map.removeLayer(dropoffMarkerRef.current);
        dropoffMarkerRef.current = null;
      }
      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      if (location) map.panTo([location.latitude, location.longitude], { animate: true });
    }
  }, [dropoffLocation]);

  useEffect(() => {
    const L = (window as any).L;
    const map = mapRef2.current;
    if (!L || !map) return;

    if (driverLocation) {
      addOrMoveDriver(L, map, driverLocation, location);
    } else {
      if (driverMarkerRef.current) {
        map.removeLayer(driverMarkerRef.current);
        driverMarkerRef.current = null;
      }
      if (driverRouteLineRef.current) {
        map.removeLayer(driverRouteLineRef.current);
        driverRouteLineRef.current = null;
      }
      if (location) map.panTo([location.latitude, location.longitude], { animate: true });
    }
  }, [driverLocation]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <div
        ref={divRef}
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      />
    </View>
  );
}
