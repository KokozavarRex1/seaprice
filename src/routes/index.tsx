import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useCallback, useRef } from "react";
import type * as Leaflet from "leaflet";
import {
  resorts,
  tabs,
  boardMeals,
  boardLabels,
  startLabels,
  bookingLink,
  fmt,
} from "@/data/resorts";
import { AIPlanner } from "@/components/AIPlanner";
import { getHybridPrice, type HybridPriceResult } from "@/lib/booking-price.functions";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("hotels");
  const [showResult, setShowResult] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const currentResort = selectedId ? resorts.find((r) => r.id === selectedId) : null;

  const [calcStart, setCalcStart] = useState("sofia");
  const [calcNights, setCalcNights] = useState(5);
  const [calcHotelIdx, setCalcHotelIdx] = useState(0);
  const [calcPeople, setCalcPeople] = useState(2);
  const [calcExtraMeals, setCalcExtraMeals] = useState(2);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markersRef = useRef<Record<string, Leaflet.Marker>>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      const L = await import("leaflet");
      if (cancelled || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
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
        marker.on("click", () => setSelectedId(r.id));
        markersRef.current[r.id] = marker;
      });

      mapRef.current = map;
      setMapReady(true);
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const resort = resorts.find((r) => r.id === selectedId);
    if (resort) {
      mapRef.current.setView([resort.lat, resort.lng], 9, { animate: true });
    }
  }, [selectedId]);

  useEffect(() => {
    if (currentResort) {
      setCalcExtraMeals(Math.max(0, 3 - (boardMeals[currentResort.hotels[0]?.board ?? "none"] ?? 0)));
      setCalcHotelIdx(0);
    }
  }, [currentResort]);

  useEffect(() => {
    if (currentResort) {
      const hotel = currentResort.hotels[calcHotelIdx];
      if (hotel) {
        setCalcExtraMeals(Math.max(0, 3 - (boardMeals[hotel.board] ?? 0)));
      }
    }
  }, [calcHotelIdx, currentResort]);

  const handleSelectResort = useCallback((id: string) => {
    setSelectedId(id);
    setActiveTab("hotels");
    setShowResult(false);
  }, []);

  const budget = (() => {
    if (!currentResort) return null;
    const hotel = currentResort.hotels[calcHotelIdx];
    if (!hotel) return null;

    const transport = currentResort.transport[calcStart];
    if (!transport) return null;

    const covered = boardMeals[hotel.board] ?? 0;
    const nightlyPrice = hotel.price;
    const mealPrice = currentResort.avgMealEUR;

    const hotelTotal = nightlyPrice * calcNights;
    const transportTotal = transport.price * calcPeople;
    const foodTotal = calcExtraMeals * mealPrice * calcNights * calcPeople;
    const extrasTotal =
      (currentResort.taxi[0]?.price ?? 0) +
      (currentResort.taxi[1]?.price ?? 0) * 5 +
      (currentResort.parking.length ? (currentResort.parking[0]?.price ?? 0) * calcNights : 0);
    const grandTotal = hotelTotal + transportTotal + foodTotal + extrasTotal;

    const hotelLabel =
      "Хотел (" + (boardLabels[hotel.board]?.split(" ·")?.[0] ?? "Без данни") + ")";

    const segments = [
      { label: hotelLabel, value: hotelTotal, color: "#145C5A" },
      { label: "Транспорт", value: transportTotal, color: "#B98A3E" },
      { label: `Храна навън (${covered} включени/ден)`, value: foodTotal, color: "#D1573A" },
      { label: "Такси + паркинг", value: extrasTotal, color: "#1C3E42" },
    ];

    return { grandTotal, segments };
  })();

  const handleCalc = () => {
    setShowResult(true);
  };

  return (
    <div className="min-h-screen bg-parchment">
      {/* Masthead */}
      <header className="bg-ink text-parchment border-b border-gold">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-5 sm:py-6 flex flex-wrap justify-between items-end gap-3.5">
          <div className="flex items-center gap-3">
            <div className="w-[34px] h-[34px] border border-gold rounded-full relative flex-shrink-0">
              <div className="absolute top-1/2 left-[6%] right-[6%] h-px bg-gold -translate-y-1/2" />
              <div className="absolute left-1/2 top-[6%] bottom-[6%] w-px bg-gold -translate-x-1/2" />
            </div>
            <div>
              <h1 className="font-serif text-[25px] font-medium tracking-wide leading-tight">Крайбрежие</h1>
              <div className="font-mono text-[11px] tracking-[1.4px] uppercase text-gold-soft mt-0.5">
                Ценови навигатор · черноморие &amp; егейско
              </div>
            </div>
          </div>
          <div className="flex gap-6 font-mono text-[11.5px] text-parchment/55 tracking-wide">
            <span>Курорти: <b className="text-gold-soft font-medium">9</b></span>
            <span>Държави: <b className="text-gold-soft font-medium">3</b></span>
            <span>Обновено: <b className="text-gold-soft font-medium">02.07.2026</b></span>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] border-x border-parchment-line">
        {/* Map */}
        <div className="relative border-r border-parchment-line h-[400px] lg:h-[680px]">
          <div className="absolute top-3.5 left-3.5 z-[500] pointer-events-none">
            <span className="font-mono text-[10.5px] tracking-wider uppercase text-parchment bg-ink/80 border border-gold px-2.5 py-1.5">
              42.6°N 27.7°E — черно море
            </span>
          </div>
          <div className="absolute top-2 left-2 w-4 h-4 z-[500] pointer-events-none border-t-[1.5px] border-l-[1.5px] border-gold" />
          <div className="absolute top-2 right-2 w-4 h-4 z-[500] pointer-events-none border-t-[1.5px] border-r-[1.5px] border-gold" />
          <div className="absolute bottom-2 left-2 w-4 h-4 z-[500] pointer-events-none border-b-[1.5px] border-l-[1.5px] border-gold" />
          <div className="absolute bottom-2 right-2 w-4 h-4 z-[500] pointer-events-none border-b-[1.5px] border-r-[1.5px] border-gold" />
          <div
            ref={mapContainerRef}
            className="h-full w-full bg-ink"
            style={{ opacity: mapReady ? 1 : 0, transition: "opacity 0.3s" }}
          />
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink">
              <span className="font-mono text-gold-soft text-xs tracking-wider uppercase">
                Зареждане на карта...
              </span>
            </div>
          )}
        </div>

        {/* Panel */}
        <div className="overflow-y-auto max-h-[680px] bg-parchment">
          {!currentResort ? (
            <div className="px-8 sm:px-10 py-16 text-center">
              <div className="font-mono text-[11px] tracking-[1.8px] uppercase text-coral-dark font-medium">
                Избери дестинация
              </div>
              <h2 className="font-serif text-[26px] font-medium mt-3 mb-2">Кликни курорт на картата</h2>
              <p className="text-muted-foreground text-sm max-w-[320px] mx-auto leading-relaxed">
                Ще видиш хотели, таксита, паркинг, ресторанти и колко струва да стигнеш дотам — плюс калкулатор за целия бюджет.
              </p>
            </div>
          ) : (
            <ResortPanel
              resort={currentResort}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              calcStart={calcStart}
              setCalcStart={setCalcStart}
              calcNights={calcNights}
              setCalcNights={setCalcNights}
              calcHotelIdx={calcHotelIdx}
              setCalcHotelIdx={setCalcHotelIdx}
              calcPeople={calcPeople}
              setCalcPeople={setCalcPeople}
              calcExtraMeals={calcExtraMeals}
              setCalcExtraMeals={setCalcExtraMeals}
              showResult={showResult}
              budget={budget}
              onCalc={handleCalc}
            />
          )}
        </div>
      </div>
      <AIPlanner onSelectResort={setSelectedId} />
    </div>
  );
}

function ResortPanel({
  resort,
  activeTab,
  onTabChange,
  calcStart,
  setCalcStart,
  calcNights,
  setCalcNights,
  calcHotelIdx,
  setCalcHotelIdx,
  calcPeople,
  setCalcPeople,
  calcExtraMeals,
  setCalcExtraMeals,
  showResult,
  budget,
  onCalc,
}: {
  resort: (typeof resorts)[0];
  activeTab: string;
  onTabChange: (tab: string) => void;
  calcStart: string;
  setCalcStart: (v: string) => void;
  calcNights: number;
  setCalcNights: (v: number) => void;
  calcHotelIdx: number;
  setCalcHotelIdx: (v: number) => void;
  calcPeople: number;
  setCalcPeople: (v: number) => void;
  calcExtraMeals: number;
  setCalcExtraMeals: (v: number) => void;
  showResult: boolean;
  budget: { grandTotal: number; segments: { label: string; value: number; color: string }[] } | null;
  onCalc: () => void;
}) {
  const covered = boardMeals[resort.hotels[calcHotelIdx]?.board ?? "none"] ?? 0;
  const hotel = resort.hotels[calcHotelIdx];

  return (
    <>
      {/* Resort Header */}
      <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-parchment-line">
        <div className="font-mono text-[11px] tracking-[1.6px] uppercase text-coral-dark font-medium">
          {resort.country}
        </div>
        <h2 className="font-serif text-[28px] font-medium mt-1.5 leading-tight">{resort.name}</h2>
        <div className="font-mono text-[11px] text-muted-foreground mt-1">
          {resort.lat.toFixed(3)}°N, {resort.lng.toFixed(3)}°E
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-0.5 px-6 sm:px-8 border-b border-parchment-line bg-[#F5EFDF]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`font-mono text-[11.5px] tracking-wide uppercase py-3 px-3.5 -mb-px border-b-2 transition-colors cursor-pointer ${
              activeTab === t.key
                ? "text-ink border-coral font-medium"
                : "text-muted-foreground border-transparent hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-6 sm:px-8 py-1.5">
        {activeTab === "transport" ? (
          <div>
            {Object.keys(startLabels).map((k) => {
              const t = resort.transport[k];
              if (!t) return null;
              return (
                <div key={k} className="flex justify-between items-center py-3.5 border-b border-parchment-line last:border-b-0">
                  <div>
                    <div className="font-medium text-[14.5px]">{startLabels[k]}</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">{t.mode} · ~{t.time}</div>
                  </div>
                  <div className="font-mono text-base font-medium text-ink whitespace-nowrap pl-3.5">
                    {fmt(t.price)}<span className="text-[11px] text-muted-foreground ml-0.5">€</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : activeTab === "hotels" ? (
          <div>
            {resort.hotels.map((item, i) => (
              <div key={i} className="flex justify-between items-start py-4 border-b border-parchment-line last:border-b-0">
                <div>
                  <div className="font-medium text-[14.5px]">{item.name}</div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">{item.meta}</div>
                  <a
                    href={bookingLink(resort.name, item.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1.5 font-mono text-[11px] tracking-wide text-teal border-b border-teal hover:text-coral-dark hover:border-coral-dark transition-colors"
                  >
                    Виж на Booking.com →
                  </a>
                </div>
                <div className="font-mono text-base font-medium text-ink whitespace-nowrap pl-3.5 pt-1">
                  {fmt(item.price)}<span className="text-[11px] text-muted-foreground ml-0.5">€</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {(resort[activeTab as keyof typeof resort] as { name: string; price: number; meta: string }[]).map(
              (item, i) => (
                <div key={i} className="flex justify-between items-center py-3.5 border-b border-parchment-line last:border-b-0">
                  <div>
                    <div className="font-medium text-[14.5px]">{item.name}</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">{item.meta}</div>
                  </div>
                  <div className="font-mono text-base font-medium text-ink whitespace-nowrap pl-3.5">
                    {fmt(item.price)}<span className="text-[11px] text-muted-foreground ml-0.5">€</span>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Calculator */}
      <div className="px-6 sm:px-8 pt-5 pb-8 mt-1 border-t border-parchment-line bg-[#F5EFDF]">
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-[1.6px] uppercase text-ink-soft mb-3.5">
          <span>Калкулатор на бюджета</span>
          <span className="flex-1 h-px bg-parchment-line" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground mb-1">
              Тръгвам от
            </label>
            <select
              value={calcStart}
              onChange={(e) => setCalcStart(e.target.value)}
              className="w-full font-sans text-sm text-ink bg-parchment border border-parchment-line px-2.5 py-2 focus:outline-none focus:border-gold"
            >
              <option value="sofia">София</option>
              <option value="plovdiv">Пловдив</option>
              <option value="varna">Варна</option>
            </select>
          </div>
          <div>
            <label className="block font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground mb-1">
              Нощувки
            </label>
            <input
              type="number"
              min={1}
              max={21}
              value={calcNights}
              onChange={(e) => setCalcNights(parseInt(e.target.value) || 1)}
              className="w-full font-sans text-sm text-ink bg-parchment border border-parchment-line px-2.5 py-2 focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground mb-1">
              Избери хотел
            </label>
            <select
              value={calcHotelIdx}
              onChange={(e) => setCalcHotelIdx(parseInt(e.target.value))}
              className="w-full font-sans text-sm text-ink bg-parchment border border-parchment-line px-2.5 py-2 focus:outline-none focus:border-gold"
            >
              {resort.hotels.map((h, i) => (
                <option key={i} value={i}>
                  {h.name} — {fmt(h.price)}€/нощ
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground mb-1">
              Хора
            </label>
            <input
              type="number"
              min={1}
              max={8}
              value={calcPeople}
              onChange={(e) => setCalcPeople(parseInt(e.target.value) || 1)}
              className="w-full font-sans text-sm text-ink bg-parchment border border-parchment-line px-2.5 py-2 focus:outline-none focus:border-gold"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground mb-1">
              Хотелска цена (фиксирана)
            </label>
            <div className="flex gap-2">
              <div className="flex-1 font-sans text-sm text-ink bg-parchment border border-parchment-line px-2.5 py-2 flex items-center justify-between">
                <span>{hotel ? `${fmt(hotel.price)}€ / нощ` : "—"}</span>
                <span className="font-mono text-[10.5px] tracking-wider uppercase text-muted-foreground">
                  фиксирана
                </span>
              </div>
              <a
                href={hotel ? bookingLink(resort.name, hotel.name) : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11.5px] tracking-wide text-parchment bg-teal px-3.5 py-2 flex items-center whitespace-nowrap hover:bg-ink-soft transition-colors"
              >
                Виж на Booking →
              </a>
            </div>
          </div>
          <div>
            <label className="block font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground mb-1">
              Излизания на ресторант на ден
            </label>
            <input
              type="number"
              min={0}
              max={3}
              value={calcExtraMeals}
              onChange={(e) => setCalcExtraMeals(parseFloat(e.target.value) || 0)}
              className="w-full font-sans text-sm text-ink bg-parchment border border-parchment-line px-2.5 py-2 focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground mb-1">
              Ресторант / човек (фиксирана)
            </label>
            <div className="w-full font-sans text-sm text-ink bg-parchment border border-parchment-line px-2.5 py-2 flex items-center justify-between">
              <span>{fmt(resort.avgMealEUR)}€</span>
              <span className="font-mono text-[10.5px] tracking-wider uppercase text-muted-foreground">
                фиксирана
              </span>
            </div>
          </div>
        </div>

        {hotel && (
          <div className="mt-2.5 p-2.5 bg-parchment border border-parchment-line border-l-[3px] border-l-gold text-[12.5px] text-ink-soft">
            <b>{boardLabels[hotel.board] || "Без данни за хранене"}</b>
            <br />
            Хотелът покрива {covered} от 3 хранения на ден. Останалите{" "}
            {Math.max(0, 3 - covered)} по подразбиране са сметнати като излизане навън — може да промениш числото по-горе.
          </div>
        )}

        <button
          onClick={onCalc}
          className="w-full mt-4 bg-coral text-parchment border-none py-3 px-4 font-mono text-[12.5px] tracking-wider uppercase font-medium cursor-pointer hover:bg-coral-dark transition-colors"
        >
          Изчисли бюджета →
        </button>

        {showResult && budget && (
          <div className="mt-5">
            <div className="flex justify-between items-baseline mb-2.5">
              <div className="font-mono text-[10.5px] tracking-[1.2px] uppercase text-muted-foreground">
                Оценен бюджет · {calcPeople} {calcPeople === 1 ? "човек" : "души"} · {calcNights} нощувки
              </div>
              <div className="font-serif text-[32px] font-medium text-ink">{fmt(budget.grandTotal)}€</div>
            </div>

            <div className="flex w-full h-[34px] border border-ink overflow-hidden">
              {budget.segments.map((s, i) => {
                const pct = budget.grandTotal > 0 ? (s.value / budget.grandTotal) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="h-full flex items-center justify-center font-mono text-[10px] text-parchment whitespace-nowrap overflow-hidden"
                    style={{ width: `${pct}%`, background: s.color }}
                    title={`${s.label}: ${fmt(s.value)}€`}
                  >
                    {pct > 8 ? `${fmt(s.value)}€` : ""}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3.5 mt-3">
              {budget.segments.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                  <span className="w-2.5 h-2.5 flex-shrink-0" style={{ background: s.color }} />
                  <span>{s.label}</span>
                  <span className="font-mono text-muted-foreground ml-0.5">{fmt(s.value)}€</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-[11.5px] text-muted-foreground mt-5 leading-relaxed pt-4 border-t border-parchment-line">
          Цените са фиксирани за курорта — хотел, транспорт и ресторант. За реалния хотел кликни "Виж на Booking".
        </div>
      </div>
    </>
  );
}
