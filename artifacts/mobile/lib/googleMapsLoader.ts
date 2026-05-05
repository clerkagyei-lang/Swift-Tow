let loadPromise: Promise<typeof google.maps> | null = null;

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const w = window as any;

    if (w.google?.maps) {
      resolve(w.google.maps);
      return;
    }

    const callbackName = "__swiftTowGmapsReady";
    w[callbackName] = () => {
      if (w.google?.maps) resolve(w.google.maps);
      else reject(new Error("Google Maps loaded but google.maps is undefined"));
    };

    const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? "";
    if (!key) {
      reject(new Error("Google Maps API key is not configured"));
      loadPromise = null;
      return;
    }

    const script = document.createElement("script");
    script.id = "gmaps-js";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Google Maps script"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
