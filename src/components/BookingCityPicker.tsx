import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { Resort } from "@/data/resorts";
import {
  resolveBookingCity,
  type CityCandidate,
  type CityResolution,
} from "@/lib/booking-demand-api.functions";

const COUNTRY_TO_ISO: Record<string, string> = {
  България: "bg",
  Гърция: "gr",
  Турция: "tr",
  Хърватия: "hr",
  Италия: "it",
  Испания: "es",
  Черна: "me",
  Албания: "al",
  Кипър: "cy",
};

function countryIso(country: string): string | undefined {
  for (const [key, iso] of Object.entries(COUNTRY_TO_ISO)) {
    if (country.includes(key)) return iso;
  }
  return undefined;
}

const storageKey = (resortId: string) => `booking-city-override:${resortId}`;

function loadOverride(resortId: string): CityCandidate | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(resortId));
    return raw ? (JSON.parse(raw) as CityCandidate) : null;
  } catch {
    return null;
  }
}

function saveOverride(resortId: string, city: CityCandidate | null) {
  if (typeof window === "undefined") return;
  if (city) {
    localStorage.setItem(storageKey(resortId), JSON.stringify(city));
  } else {
    localStorage.removeItem(storageKey(resortId));
  }
}

export function BookingCityPicker({ resort }: { resort: Resort }) {
  const resolve = useServerFn(resolveBookingCity);
  const [override, setOverride] = useState<CityCandidate | null>(null);
  const [resolution, setResolution] = useState<CityResolution | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [searchName, setSearchName] = useState(resort.name);
  const [manualId, setManualId] = useState("");

  // При смяна на курорта — заредете override и опитайте авторезолвиране.
  useEffect(() => {
    const stored = loadOverride(resort.id);
    setOverride(stored);
    setResolution(null);
    setExpanded(false);
    setSearchName(resort.name);
    setManualId("");
    // Ако вече имаме override или предефиниран id — не викайте API.
    if (stored || resort.bookingCityId) return;
    let cancelled = false;
    setLoading(true);
    resolve({ data: { name: resort.name, country: countryIso(resort.country) } })
      .then((res) => {
        if (cancelled) return;
        setResolution(res);
        if (res.autoSelected) {
          saveOverride(resort.id, res.autoSelected);
          setOverride(res.autoSelected);
        }
      })
      .catch(() => {
        if (!cancelled) setResolution({ candidates: [], autoSelected: null, reason: "api_unavailable" });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [resort.id, resort.name, resort.country, resort.bookingCityId, resolve]);

  const currentId = override?.id ?? resort.bookingCityId ?? null;
  const currentLabel = override
    ? `${override.name}${override.region ? ` · ${override.region}` : ""} (#${override.id})`
    : resort.bookingCityId
      ? `Предефиниран · #${resort.bookingCityId}`
      : null;

  const runSearch = async () => {
    setLoading(true);
    try {
      const res = await resolve({
        data: { name: searchName.trim(), country: countryIso(resort.country) },
      });
      setResolution(res);
    } catch (err) {
      setResolution({
        candidates: [],
        autoSelected: null,
        reason: "api_unavailable",
        error: err instanceof Error ? err.message : "Грешка",
      });
    } finally {
      setLoading(false);
    }
  };

  const pick = (c: CityCandidate) => {
    saveOverride(resort.id, c);
    setOverride(c);
    setExpanded(false);
  };

  const clearOverride = () => {
    saveOverride(resort.id, null);
    setOverride(null);
  };

  const applyManualId = () => {
    const id = parseInt(manualId, 10);
    if (!Number.isFinite(id) || id <= 0) return;
    pick({ id, name: `Ръчно #${id}`, region: "manual" });
    setManualId("");
  };

  const needsManual =
    !override &&
    !resort.bookingCityId &&
    resolution &&
    (resolution.reason === "ambiguous" || resolution.reason === "no_match");

  return (
    <div className="py-3 border-b border-parchment-line">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground">
            Booking град
          </div>
          <div className="text-[13px] text-ink mt-0.5 truncate">
            {loading
              ? "Търси се…"
              : currentLabel
                ? currentLabel
                : needsManual
                  ? "Изисква ръчно избиране"
                  : resolution?.reason === "api_unavailable"
                    ? "API не е конфигуриран — въведете ID ръчно"
                    : "Не е избран"}
          </div>
          {resolution?.error && !currentId && (
            <div className="text-[10.5px] text-coral-dark mt-0.5">{resolution.error}</div>
          )}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {currentId && !resort.bookingCityId && (
            <button
              onClick={clearOverride}
              className="font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground border border-parchment-line px-2 py-1 hover:text-coral-dark hover:border-coral-dark"
            >
              Изчисти
            </button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="font-mono text-[10.5px] tracking-wide uppercase text-teal border border-teal px-2 py-1 hover:bg-teal hover:text-parchment"
          >
            {expanded ? "Скрий" : currentId ? "Смени" : "Избери"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2.5">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Име на град"
              className="flex-1 font-sans text-sm text-ink bg-parchment border border-parchment-line px-2.5 py-1.5 focus:outline-none focus:border-gold"
            />
            <button
              onClick={runSearch}
              disabled={loading || searchName.trim().length < 2}
              className="font-mono text-[10.5px] tracking-wide uppercase text-parchment bg-teal px-3 py-1.5 disabled:opacity-40"
            >
              Търси
            </button>
          </div>

          {resolution && resolution.candidates.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-parchment-line">
              {resolution.candidates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => pick(c)}
                  className="w-full text-left px-2.5 py-2 border-b border-parchment-line last:border-b-0 hover:bg-[#F5EFDF] flex justify-between items-center gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] text-ink truncate">{c.name}</div>
                    <div className="text-[10.5px] text-muted-foreground truncate">
                      {[c.region, c.country?.toUpperCase()].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div className="font-mono text-[10.5px] text-muted-foreground flex-shrink-0">#{c.id}</div>
                </button>
              ))}
            </div>
          )}

          {resolution && resolution.candidates.length === 0 && !loading && (
            <div className="text-[11px] text-muted-foreground">
              Няма резултати. Можете да въведете Booking city ID ръчно:
            </div>
          )}

          <div className="flex gap-1.5">
            <input
              type="number"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="Booking city ID (напр. -2140479)"
              className="flex-1 font-sans text-sm text-ink bg-parchment border border-parchment-line px-2.5 py-1.5 focus:outline-none focus:border-gold"
            />
            <button
              onClick={applyManualId}
              disabled={!manualId.trim()}
              className="font-mono text-[10.5px] tracking-wide uppercase text-ink border border-ink px-3 py-1.5 disabled:opacity-40 hover:bg-ink hover:text-parchment"
            >
              Приложи
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
