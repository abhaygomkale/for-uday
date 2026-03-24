import { useEffect, useRef } from "react";

export default function MapView({ cities, selectedCity, onCityClick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // 🔥 INIT MAP
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const L = window.L;
    if (!L) {
      console.error("Leaflet not loaded");
      return;
    }

    const map = L.map(containerRef.current, {
      center: [22.5, 80.5],
      zoom: 5,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    L.control
      .attribution({
        prefix: "© OpenStreetMap © CARTO",
        position: "bottomleft",
      })
      .addTo(map);

    mapRef.current = map;
  }, []);

  // 🔥 UPDATE MARKERS
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;

    if (!L || !map) return;

    // Clear markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 🔥 IF NO DATA → RESET VIEW
    if (!cities || cities.length === 0) {
      map.setView([22.5, 80.5], 5);
      return;
    }

    cities.forEach((city) => {
      const isSel = selectedCity?.city === city.city;

      const color =
        city.high_count > 2
          ? "#ef4444" // red
          : city.high_count > 0
          ? "#f59e0b" // yellow
          : "#22c55e"; // green

      const icon = L.divIcon({
        html: `
          <div class="mk ${isSel ? "sel" : ""}">
            <div class="mk-ring" style="border-color:${color}"></div>
            <div class="mk-dot" style="background:${color}"></div>
            <span class="mk-lbl">${city.city}</span>
          </div>
        `,
        className: "",
        iconSize: [56, 56],
        iconAnchor: [28, 28],
      });

      const marker = L.marker([city.lat, city.lon], { icon }).addTo(map);

      marker.on("click", () => {
        onCityClick(city);

        // 🔥 AUTO ZOOM ON CLICK
        map.setView([city.lat, city.lon], 7);
      });

      markersRef.current.push(marker);
    });
  }, [cities, selectedCity, onCityClick]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      
      {/* 🔥 EMPTY STATE MESSAGE */}
      {(!cities || cities.length === 0) && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.7)",
            padding: "10px 16px",
            borderRadius: "8px",
            color: "#fff",
            zIndex: 1000,
          }}
        >
          No disaster data for selected date
        </div>
      )}

      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}