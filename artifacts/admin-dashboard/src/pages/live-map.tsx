import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Wifi, WifiOff, RefreshCw } from "lucide-react";

interface DriverOnMap {
  id: string;
  name: string;
  vehicleType: string;
  vehiclePlate: string;
  isOnline: boolean;
  currentLocation: { latitude: number; longitude: number } | null;
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

function loadSocketIO(): Promise<any> {
  return new Promise((resolve) => {
    const w = window as any;
    if (w.io) { resolve(w.io); return; }
    if (!document.getElementById("socketio-js")) {
      const script = document.createElement("script");
      script.id = "socketio-js";
      script.src = "https://cdn.socket.io/4.7.5/socket.io.min.js";
      script.onload = () => resolve(w.io);
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (w.io) { clearInterval(interval); resolve(w.io); }
      }, 50);
    }
  });
}

function makeDriverIcon(L: any, name: string, isActive: boolean) {
  const bg = isActive ? "#F97316" : "#64748b";
  return L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
      <div style="width:40px;height:40px;border-radius:50%;background:${bg};border:3px solid white;
        box-shadow:0 3px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M20 8h-3L15 4H5c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM8 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm9 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-7V9.5h2.5l1.96 2.5H16z"/>
        </svg>
      </div>
      <div style="background:rgba(0,0,0,0.75);color:white;font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;white-space:nowrap;max-width:90px;overflow:hidden;text-overflow:ellipsis">${name}</div>
    </div>`,
    className: "",
    iconSize: [40, 60],
    iconAnchor: [20, 55],
    popupAnchor: [0, -55],
  });
}

export default function LiveMapPage() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const socketRef = useRef<any>(null);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [drivers, setDrivers] = useState<DriverOnMap[]>([]);

  async function fetchAndPlotDrivers(L: any, map: any) {
    try {
      const res = await fetch("/api/drivers");
      if (!res.ok) return;
      const data: DriverOnMap[] = await res.json();
      const online = data.filter((d) => d.isOnline && d.currentLocation);
      setDrivers(data);
      setOnlineCount(online.length);
      setLastUpdate(new Date());

      for (const driver of online) {
        if (!driver.currentLocation) continue;
        const { latitude: lat, longitude: lng } = driver.currentLocation;
        const existing = markersRef.current.get(driver.id);
        if (existing) {
          existing.setLatLng([lat, lng]);
        } else {
          const icon = makeDriverIcon(L, driver.name, true);
          const marker = L.marker([lat, lng], { icon })
            .addTo(map)
            .bindPopup(
              `<b>${driver.name}</b><br/>
               ${driver.vehicleType} · ${driver.vehiclePlate}<br/>
               <span style="color:#16a34a;font-weight:600">● Online</span>`
            );
          markersRef.current.set(driver.id, marker);
        }
      }

      const offlineIds = new Set(data.filter((d) => !d.isOnline).map((d) => d.id));
      for (const [id, marker] of markersRef.current.entries()) {
        if (offlineIds.has(id)) {
          map.removeLayer(marker);
          markersRef.current.delete(id);
        }
      }
    } catch {}
  }

  useEffect(() => {
    let cancelled = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    (async () => {
      const [L, io] = await Promise.all([loadLeaflet(), loadSocketIO()]);
      if (cancelled || !mapDivRef.current || mapRef.current) return;

      const map = L.map(mapDivRef.current, {
        center: [ACCRA.lat, ACCRA.lng],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      await fetchAndPlotDrivers(L, map);

      pollInterval = setInterval(() => fetchAndPlotDrivers(L, map), 5000);

      const socket = io(window.location.origin, {
        path: "/api/socket.io",
        transports: ["websocket", "polling"],
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        if (!cancelled) setConnected(true);
      });
      socket.on("disconnect", () => {
        if (!cancelled) setConnected(false);
      });

      socket.on(
        "driver:location:update",
        ({ driverId, location }: { driverId: string; location: { latitude: number; longitude: number } }) => {
          if (cancelled) return;
          setLastUpdate(new Date());
          const existingMarker = markersRef.current.get(driverId);
          if (existingMarker) {
            existingMarker.setLatLng([location.latitude, location.longitude]);
          } else {
            const driver = drivers.find((d) => d.id === driverId);
            const name = driver?.name ?? "Driver";
            const icon = makeDriverIcon(L, name, true);
            const marker = L.marker([location.latitude, location.longitude], { icon })
              .addTo(map)
              .bindPopup(`<b>${name}</b><br/><span style="color:#16a34a;font-weight:600">● Online</span>`);
            markersRef.current.set(driverId, marker);
            setOnlineCount((c) => c + 1);
          }
        }
      );
    })();

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
      socketRef.current?.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground">Live Driver Map</h1>
          <p className="text-sm text-muted-foreground">Real-time GPS positions of all active drivers in Accra</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`gap-1.5 text-sm px-3 py-1 ${connected ? "border-green-500 text-green-600" : "border-muted-foreground text-muted-foreground"}`}
          >
            {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {connected ? "Live" : "Connecting…"}
          </Badge>
          <Badge variant="secondary" className="gap-1.5 text-sm px-3 py-1">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            {onlineCount} Online
          </Badge>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 gap-0">
        <div className="flex-1 relative">
          <div ref={mapDivRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />
        </div>

        <aside className="w-64 border-l border-border bg-card overflow-y-auto shrink-0">
          <div className="p-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Online Drivers</p>
          </div>
          {drivers.filter((d) => d.isOnline).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
              <MapPin className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No drivers online</p>
              <p className="text-xs text-muted-foreground/60">Drivers appear here when they go online in the app</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {drivers
                .filter((d) => d.isOnline)
                .map((driver) => (
                  <div
                    key={driver.id}
                    className="px-3 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      if (driver.currentLocation && mapRef.current) {
                        mapRef.current.setView(
                          [driver.currentLocation.latitude, driver.currentLocation.longitude],
                          16,
                          { animate: true }
                        );
                        markersRef.current.get(driver.id)?.openPopup();
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      <p className="text-sm font-semibold text-foreground truncate">{driver.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-4">
                      {driver.vehicleType} · {driver.vehiclePlate}
                    </p>
                    {driver.currentLocation && (
                      <p className="text-xs text-muted-foreground/60 mt-0.5 ml-4">
                        {driver.currentLocation.latitude.toFixed(4)}, {driver.currentLocation.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          )}

          {drivers.filter((d) => !d.isOnline).length > 0 && (
            <>
              <div className="p-3 border-b border-border border-t mt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Offline</p>
              </div>
              <div className="divide-y divide-border opacity-50">
                {drivers
                  .filter((d) => !d.isOnline)
                  .map((driver) => (
                    <div key={driver.id} className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground shrink-0" />
                        <p className="text-sm font-medium text-muted-foreground truncate">{driver.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground/60 mt-0.5 ml-4">
                        {driver.vehicleType} · {driver.vehiclePlate}
                      </p>
                    </div>
                  ))}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
