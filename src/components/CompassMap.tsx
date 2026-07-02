import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { resorts } from "@/data/resorts";

interface CompassMapProps {
  onSelectResort: (id: string) => void;
  selectedId: string | null;
}

export default function CompassMap({ onSelectResort, selectedId }: CompassMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: false,
    }).setView([40.9, 26.5], 6);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map);

    const tilePane = map.getPane("tilePane");
    if (tilePane) {
      tilePane.style.filter = "grayscale(0.35) sepia(0.15) brightness(0.9) contrast(1.05)";
    }

    const pinIcon = () =>
      L.divIcon({
        className: "",
        html: '<div class="compass-pin"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

    resorts.forEach((r) => {
      const marker = L.marker([r.lat, r.lng], { icon: pinIcon() }).addTo(map);
      marker.bindTooltip(r.name, { direction: "top", offset: [0, -10] });
      marker.on("click", () => onSelectResort(r.id));
      markersRef.current[r.id] = marker;
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, [onSelectResort]);

  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const resort = resorts.find((r) => r.id === selectedId);
    if (resort) {
      mapRef.current.setView([resort.lat, resort.lng], 9, { animate: true });
    }
  }, [selectedId]);

  return (
    <div className="relative h-full min-h-[400px] lg:min-h-0 bg-ink">
      <div className="absolute top-3.5 left-3.5 z-[500] pointer-events-none">
        <span className="font-mono text-[10.5px] tracking-wider uppercase text-parchment bg-ink/80 border border-gold px-2.5 py-1.5">
          42.6°N 27.7°E — черно море
        </span>
      </div>
      <div className="absolute top-2 left-2 w-4 h-4 z-[500] pointer-events-none border-t-[1.5px] border-l-[1.5px] border-gold" />
      <div className="absolute top-2 right-2 w-4 h-4 z-[500] pointer-events-none border-t-[1.5px] border-r-[1.5px] border-gold" />
      <div className="absolute bottom-2 left-2 w-4 h-4 z-[500] pointer-events-none border-b-[1.5px] border-l-[1.5px] border-gold" />
      <div className="absolute bottom-2 right-2 w-4 h-4 z-[500] pointer-events-none border-b-[1.5px] border-r-[1.5px] border-gold" />
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
