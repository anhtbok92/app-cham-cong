"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icon issue
if (typeof window !== "undefined") {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationPick?: (lat: number, lng: number) => void;
  readonly?: boolean;
}

function LocationMarker({ lat, lng, setPosition, readonly }: { lat: number, lng: number, setPosition: (lat: number, lng: number) => void, readonly?: boolean }) {
  useMapEvents({
    click(e) {
      if (!readonly) {
        setPosition(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return lat !== 0 ? <Marker position={[lat, lng]} /> : null;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    // Small timeout to ensure container is ready and prevent "black screen"
    const timer = setTimeout(() => {
      map.invalidateSize();
      map.setView(center, 15);
    }, 100);
    return () => clearTimeout(timer);
  }, [center, map]);
  return null;
}

export default function MapPicker({ initialLat, initialLng, onLocationPick, readonly = false }: MapPickerProps) {
  const [pos, setPos] = useState<[number, number]>([initialLat || 10.7769, initialLng || 106.7009]);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Update position if initialLat/Lng changes (e.g. from GPS)
  useEffect(() => {
    if (initialLat && initialLng) {
      setPos([initialLat, initialLng]);
    }
  }, [initialLat, initialLng]);

  const handlePick = useCallback((lat: number, lng: number) => {
    setPos([lat, lng]);
    if (onLocationPick) {
      onLocationPick(lat, lng);
    }
    setShowSuggestions(false);
  }, [onLocationPick]);

  // Debounced search for suggestions
  useEffect(() => {
    if (readonly) return;
    const timer = setTimeout(async () => {
      if (search.trim().length > 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=5&addressdetails=1`);
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(true);
        } catch (err) {
          console.error("Suggestion error:", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, readonly]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      const { lat, lon } = suggestions[0];
      handlePick(parseFloat(lat), parseFloat(lon));
    }
  };

  return (
    <div className={`space-y-4  ${readonly ? 'h-full' : ''}`}>
      {!readonly && (
        <div className="relative group">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-colors text-[20px]">
                location_searching
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => search.length > 2 && setShowSuggestions(true)}
                placeholder="Tìm địa điểm chính xác..."
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-10 pr-4 py-2 text-body-sm outline-none focus:border-secondary transition-all shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="rounded-xl bg-surface-container px-6 py-2 text-label-md font-bold text-on-surface hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              {isSearching ? "..." : "Tìm"}
            </button>
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-[2000] mt-2 w-full rounded-xl border border-outline-variant bg-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <ul className="max-h-60 overflow-auto py-1 divide-y divide-slate-50">
                {suggestions.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => {
                      setSearch(item.display_name);
                      handlePick(parseFloat(item.lat), parseFloat(item.lon));
                    }}
                    className="cursor-pointer px-4 py-3 text-body-sm hover:bg-secondary/5 hover:text-secondary transition-colors flex items-start gap-3"
                  >
                    <span className="material-symbols-outlined text-slate-400 text-[18px] mt-0.5">place</span>
                    <span className="line-clamp-2">{item.display_name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className={`${readonly ? 'h-full' : 'h-[300px]'} w-full overflow-hidden ${readonly ? '' : 'rounded-2xl border border-outline-variant shadow-inner'} relative z-0`}>
        <MapContainer center={pos} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={!readonly} zoomControl={!readonly} dragging={!readonly}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker lat={pos[0]} lng={pos[1]} setPosition={handlePick} readonly={readonly} />
          <ChangeView center={pos} />
        </MapContainer>
        
        {!readonly && (
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-outline-variant shadow-sm pointer-events-none">
            <p className="text-[10px] font-bold text-secondary uppercase tracking-tight italic">
              * Click để ghim vị trí
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
