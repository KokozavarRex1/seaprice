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
  diningTierLabels,
  diningTierDescriptions,
  bookingLink,
  fmt,
  type DiningTiers,
} from "@/data/resorts";
import { AIPlanner } from "@/components/AIPlanner";
import { getBookingRooms, type BookingRoomsResult } from "@/lib/booking-price.functions";
import palm2Asset from "@/assets/palm2.png.asset.json";


export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("hotels");
  const [showResult, setShowResult] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [taxiKmPerDay, setTaxiKmPerDay] = useState<number>(10);
  const [taxiNightShare, setTaxiNightShare] = useState<number>(20); // %

  const currentResort = selectedId ? resorts.find((r) => r.id === selectedId) : null;

  // Дати по подразбиране: след 14 дни, 5 нощувки
  const today = new Date();
  const defaultCheckin = new Date(today.getTime() + 14 * 86400_000).toISOString().slice(0, 10);
  const defaultCheckout = new Date(today.getTime() + 19 * 86400_000).toISOString().slice(0, 10);

  const [calcStart, setCalcStart] = useState("sofia");
  const [calcCheckin, setCalcCheckin] = useState(defaultCheckin);
  const [calcCheckout, setCalcCheckout] = useState(defaultCheckout);
  const [calcHotelIdx, setCalcHotelIdx] = useState(0);
  const [calcPeople, setCalcPeople] = useState(2);
  
  const [roomsResult, setRoomsResult] = useState<BookingRoomsResult | null>(null);
  const [selectedRoomIdx, setSelectedRoomIdx] = useState<number>(0);
  const [checkingPrice, setCheckingPrice] = useState(false);
  const [manualPriceMode, setManualPriceMode] = useState(false);
  const [manualPriceTotal, setManualPriceTotal] = useState<string>("");

  // Дни на ресторант по нива (на човек, за целия престой)
  const [mealDays, setMealDays] = useState<Record<keyof DiningTiers, number>>({
    fastFood: 2,
    midRange: 2,
    fineDining: 0,
  });

  const calcNights = Math.max(
    1,
    Math.round(
      (new Date(calcCheckout + "T00:00:00Z").getTime() -
        new Date(calcCheckin + "T00:00:00Z").getTime()) /
        86400_000,
    ),
  );

  const fetchRooms = useServerFn(getBookingRooms);

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
        tilePane.style.filter = "saturate(0.85) brightness(1.02) contrast(1.03)";
      }

      const pinIcon = () =>
        L.divIcon({
          className: "",
          html: `<div class="palm-pin"><img src="${palm2Asset.url}" alt="" draggable="false"/></div>`,
          iconSize: [38, 42],
          iconAnchor: [19, 40],
          popupAnchor: [0, -36],
        });


      resorts.forEach((r) => {
        const marker = L.marker([r.lat, r.lng], { icon: pinIcon() }).addTo(map);
        marker.bindTooltip(r.name, { direction: "top", offset: [0, -32] });
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
      setCalcHotelIdx(0);
    }
  }, [currentResort]);

  const handleSelectResort = useCallback((id: string) => {
    setSelectedId(id);
    setActiveTab("hotels");
    setShowResult(false);
  }, []);

  // Инвалидираме реалната цена при промяна на хотел/дати/хора
  useEffect(() => {
    setRoomsResult(null);
    setSelectedRoomIdx(0);
    setShowResult(false);
  }, [calcHotelIdx, calcCheckin, calcCheckout, calcPeople, selectedId]);

  const selectedRoom = roomsResult?.rooms[selectedRoomIdx] ?? null;

  // Общо дни хапване навън на човек (гарнирано с nights)
  const mealDaysTotal = mealDays.fastFood + mealDays.midRange + mealDays.fineDining;
  const mealDaysOverflow = mealDaysTotal > calcNights;

  const budget = (() => {
    if (!currentResort) return null;
    const hotel = currentResort.hotels[calcHotelIdx];
    if (!hotel) return null;

    const transport = currentResort.transport[calcStart];
    if (!transport) return null;

    const dining = currentResort.dining;

    const manualTotal = manualPriceMode ? parseFloat(manualPriceTotal) : NaN;
    const hasManual = manualPriceMode && isFinite(manualTotal) && manualTotal > 0;
    const hotelTotal = hasManual
      ? manualTotal
      : selectedRoom
        ? selectedRoom.totalEUR
        : roomsResult
          ? roomsResult.estimateTotal
          : hotel.price * calcNights;
    const transportTotal = transport.price * calcPeople;

    const foodFast = mealDays.fastFood * dining.fastFood * calcPeople;
    const foodMid = mealDays.midRange * dining.midRange * calcPeople;
    const foodFine = mealDays.fineDining * dining.fineDining * calcPeople;
    const foodTotal = foodFast + foodMid + foodFine;

    const extrasTotal =
      (currentResort.taxi[0]?.price ?? 0) +
      (currentResort.taxi[1]?.price ?? 0) * 5;
    const grandTotal = hotelTotal + transportTotal + foodTotal + extrasTotal;

    const priceLabel = hasManual ? " · ръчно" : selectedRoom ? " · Booking" : "";
    const hotelLabel =
      "Хотел (" + (boardLabels[hotel.board]?.split(" ·")?.[0] ?? "Без данни") + priceLabel + ")";

    const segments = [
      { label: hotelLabel, value: hotelTotal, color: "#145C5A" },
      { label: "Транспорт", value: transportTotal, color: "#B98A3E" },
      { label: "Бързо хранене", value: foodFast, color: "#E8A94A" },
      { label: "Приличен ресторант", value: foodMid, color: "#D1573A" },
      { label: "Скъп ресторант", value: foodFine, color: "#8C3A7A" },
      { label: "Такси (резерв)", value: extrasTotal, color: "#1C3E42" },
    ];

    return { grandTotal, segments };
  })();

  const handleCalc = () => {
    setShowResult(true);
  };

  const handleCheckPrice = async () => {
    if (!currentResort) return;
    const hotel = currentResort.hotels[calcHotelIdx];
    if (!hotel) return;
    setCheckingPrice(true);
    try {
      const result = await fetchRooms({
        data: {
          hotelName: hotel.name,
          resortName: currentResort.name,
          bookingUrl: hotel.bookingUrl,
          basePrice: hotel.price,
          checkin: calcCheckin,
          checkout: calcCheckout,
          adults: calcPeople,
        },
      });
      setRoomsResult(result);
      setSelectedRoomIdx(0);
      setShowResult(true);
    } catch (err) {
      console.error("[handleCheckPrice]", err);
    } finally {
      setCheckingPrice(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Masthead */}
      <header className="sea-hero text-parchment border-b border-gold/40">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-5 sm:py-7 grid grid-cols-[minmax(0,1fr)_auto] sm:flex sm:flex-wrap sm:justify-between sm:items-end gap-3.5 relative z-10">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-[38px] h-[38px] border border-gold/70 rounded-full relative shrink-0 grid place-items-center bg-ink/30 backdrop-blur-sm">
              <div className="absolute top-1/2 left-[6%] right-[6%] h-px bg-gold -translate-y-1/2" />
              <div className="absolute left-1/2 top-[6%] bottom-[6%] w-px bg-gold -translate-x-1/2" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-[22px] sm:text-[26px] font-medium tracking-wide leading-tight truncate">SeaPrice</h1>
              <div className="font-mono text-[10.5px] sm:text-[11px] tracking-[1.4px] uppercase text-gold-soft mt-0.5 truncate">
                Ценови навигатор · море &amp; релакс
              </div>
            </div>
          </div>
          <div className="hidden sm:flex gap-6 font-mono text-[11.5px] text-parchment/70 tracking-wide">
            <span>Курорти: <b className="text-gold-soft font-medium">9</b></span>
            <span>Държави: <b className="text-gold-soft font-medium">3</b></span>
            <span>Обновено: <b className="text-gold-soft font-medium">02.07.2026</b></span>
          </div>
          <div className="flex sm:hidden font-mono text-[10px] text-parchment/70 tracking-wide items-center">
            <span className="px-2 py-1 rounded-full border border-gold/40 bg-ink/30"><b className="text-gold-soft">9</b> курорта</span>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] lg:border-x border-parchment-line lg:mt-6 lg:rounded-2xl lg:overflow-hidden lg:shadow-[var(--shadow-elev)] bg-parchment">
        {/* Map */}
        <div className="relative lg:border-r border-parchment-line h-[320px] sm:h-[420px] lg:h-[680px]">
          <div className="absolute top-3.5 left-3.5 z-[500] pointer-events-none">
            <span className="font-mono text-[10px] sm:text-[10.5px] tracking-wider uppercase text-parchment bg-ink/70 border border-gold/60 backdrop-blur-md rounded-md px-2.5 py-1.5">
              42.6°N 27.7°E — море
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
            <div className="absolute inset-0 flex items-center justify-center sea-hero">
              <span className="font-mono text-gold-soft text-xs tracking-wider uppercase relative z-10">
                Зареждане на карта...
              </span>
            </div>
          )}
        </div>

        {/* Panel */}
        <div className="overflow-y-auto lg:max-h-[680px] bg-parchment">
          {!currentResort ? (
            <div className="px-8 sm:px-10 py-16 text-center">
              <div className="font-mono text-[11px] tracking-[1.8px] uppercase text-coral-dark font-medium">
                Изберете дестинация
              </div>
              <h2 className="font-serif text-[26px] font-medium mt-3 mb-2">Кликнете върху курорт на картата</h2>
              <p className="text-muted-foreground text-sm max-w-[320px] mx-auto leading-relaxed">
                Ще видите хотели, таксита, паркинг, ресторанти и колко струва да стигнете дотам — плюс калкулатор за целия бюджет.
              </p>
            </div>
          ) : (
            <ResortPanel
              resort={currentResort}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              calcStart={calcStart}
              setCalcStart={setCalcStart}
              calcCheckin={calcCheckin}
              setCalcCheckin={setCalcCheckin}
              calcCheckout={calcCheckout}
              setCalcCheckout={setCalcCheckout}
              calcNights={calcNights}
              calcHotelIdx={calcHotelIdx}
              setCalcHotelIdx={setCalcHotelIdx}
              calcPeople={calcPeople}
              setCalcPeople={setCalcPeople}
              mealDays={mealDays}
              setMealDays={setMealDays}
              mealDaysOverflow={mealDaysOverflow}
              showResult={showResult}
              budget={budget}
              onCalc={handleCalc}
              roomsResult={roomsResult}
              selectedRoomIdx={selectedRoomIdx}
              onSelectRoomIdx={setSelectedRoomIdx}
              checkingPrice={checkingPrice}
              onCheckPrice={handleCheckPrice}
              manualPriceMode={manualPriceMode}
              setManualPriceMode={setManualPriceMode}
              manualPriceTotal={manualPriceTotal}
              setManualPriceTotal={setManualPriceTotal}
              taxiKmPerDay={taxiKmPerDay}
              setTaxiKmPerDay={setTaxiKmPerDay}
              taxiNightShare={taxiNightShare}
              setTaxiNightShare={setTaxiNightShare}
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
  calcCheckin,
  setCalcCheckin,
  calcCheckout,
  setCalcCheckout,
  calcNights,
  calcHotelIdx,
  setCalcHotelIdx,
  calcPeople,
  setCalcPeople,
  calcExtraMeals,
  setCalcExtraMeals,
  showResult,
  budget,
  onCalc,
  roomsResult,
  selectedRoomIdx,
  onSelectRoomIdx,
  checkingPrice,
  onCheckPrice,
  manualPriceMode,
  setManualPriceMode,
  manualPriceTotal,
  setManualPriceTotal,
  taxiKmPerDay,
  setTaxiKmPerDay,
  taxiNightShare,
  setTaxiNightShare,
}: {
  resort: (typeof resorts)[0];
  activeTab: string;
  onTabChange: (tab: string) => void;
  calcStart: string;
  setCalcStart: (v: string) => void;
  calcCheckin: string;
  setCalcCheckin: (v: string) => void;
  calcCheckout: string;
  setCalcCheckout: (v: string) => void;
  calcNights: number;
  calcHotelIdx: number;
  setCalcHotelIdx: (v: number) => void;
  calcPeople: number;
  setCalcPeople: (v: number) => void;
  calcExtraMeals: number;
  setCalcExtraMeals: (v: number) => void;
  showResult: boolean;
  budget: { grandTotal: number; segments: { label: string; value: number; color: string }[] } | null;
  onCalc: () => void;
  roomsResult: BookingRoomsResult | null;
  selectedRoomIdx: number;
  onSelectRoomIdx: (idx: number) => void;
  checkingPrice: boolean;
  onCheckPrice: () => void;
  manualPriceMode: boolean;
  setManualPriceMode: (v: boolean) => void;
  manualPriceTotal: string;
  setManualPriceTotal: (v: string) => void;
  taxiKmPerDay: number;
  setTaxiKmPerDay: (v: number) => void;
  taxiNightShare: number;
  setTaxiNightShare: (v: number) => void;
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
      <div className="flex flex-wrap gap-0.5 px-6 sm:px-8 border-b border-parchment-line bg-[oklch(0.97_0.015_220)]">
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
                    href={item.bookingUrl ?? bookingLink(resort.name, item.name)}
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
        ) : activeTab === "taxi" ? (
          <div>
            <div className="grid grid-cols-3 gap-2 py-3.5 border-b border-parchment-line">
              <div>
                <div className="font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground">Такса пуск</div>
                <div className="font-mono text-[15px] font-medium text-ink mt-0.5">{resort.taxiRates.start.toFixed(2)}€</div>
              </div>
              <div>
                <div className="font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground">Дневна ⛅</div>
                <div className="font-mono text-[15px] font-medium text-ink mt-0.5">{resort.taxiRates.dayPerKm.toFixed(2)}€/км</div>
              </div>
              <div>
                <div className="font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground">Нощна 🌙</div>
                <div className="font-mono text-[15px] font-medium text-ink mt-0.5">{resort.taxiRates.nightPerKm.toFixed(2)}€/км</div>
              </div>
            </div>

            <div className="py-3.5 border-b border-parchment-line grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground mb-1">
                  Км/ден
                </label>
                <input
                  type="number"
                  min={0}
                  value={taxiKmPerDay}
                  onChange={(e) => setTaxiKmPerDay(parseFloat(e.target.value) || 0)}
                  className="w-full font-sans text-sm text-ink bg-parchment border border-parchment-line px-2.5 py-2 focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground mb-1">
                  Дял нощни курсове ({taxiNightShare}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={taxiNightShare}
                  onChange={(e) => setTaxiNightShare(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {(() => {
              const km = taxiKmPerDay;
              const nightKm = (km * taxiNightShare) / 100;
              const dayKm = km - nightKm;
              const perDay =
                resort.taxiRates.start + dayKm * resort.taxiRates.dayPerKm + nightKm * resort.taxiRates.nightPerKm;
              const perWeek = perDay * 7;
              return (
                <div className="py-3.5 grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-parchment border border-parchment-line">
                    <div className="font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground">Прогноза / ден</div>
                    <div className="font-serif text-[22px] font-medium text-ink mt-0.5">{fmt(perDay)}€</div>
                    <div className="font-mono text-[10.5px] text-muted-foreground mt-0.5">
                      {fmt(dayKm)}км дневна + {fmt(nightKm)}км нощна + пуск
                    </div>
                  </div>
                  <div className="p-2.5 bg-parchment border border-parchment-line">
                    <div className="font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground">За 7 дни</div>
                    <div className="font-serif text-[22px] font-medium text-ink mt-0.5">{fmt(perWeek)}€</div>
                  </div>
                </div>
              );
            })()}

            {resort.taxiRates.source && (
              <div className="font-mono text-[10.5px] text-muted-foreground pt-1 pb-2">
                Източник: {resort.taxiRates.source}
              </div>
            )}
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
      <div className="px-6 sm:px-8 pt-5 pb-8 mt-1 border-t border-parchment-line bg-[oklch(0.97_0.015_220)]">
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
              Настаняване
            </label>
            <input
              type="date"
              value={calcCheckin}
              onChange={(e) => setCalcCheckin(e.target.value)}
              className="w-full font-sans text-sm text-ink bg-parchment border border-parchment-line px-2.5 py-2 focus:outline-none focus:border-gold"
            />
          </div>
          <div className="sm:col-start-2">
            <label className="block font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground mb-1">
              Освобождаване ({calcNights} {calcNights === 1 ? "нощ" : "нощи"})
            </label>
            <input
              type="date"
              value={calcCheckout}
              min={calcCheckin}
              onChange={(e) => setCalcCheckout(e.target.value)}
              className="w-full font-sans text-sm text-ink bg-parchment border border-parchment-line px-2.5 py-2 focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground mb-1">
              Изберете хотел
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
            <div className="flex justify-between items-center mb-1">
              <label className="font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground">
                Цена на хотела за престоя
              </label>
              <button
                type="button"
                onClick={() => setManualPriceMode(!manualPriceMode)}
                className={`font-mono text-[10.5px] tracking-wider uppercase px-2 py-0.5 border transition-colors cursor-pointer ${
                  manualPriceMode
                    ? "border-coral text-coral-dark bg-parchment"
                    : "border-parchment-line text-muted-foreground hover:border-gold hover:text-ink"
                }`}
              >
                {manualPriceMode ? "✓ Ръчно" : "Въведете ръчно"}
              </button>
            </div>

            {manualPriceMode ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <div className="flex-1 min-w-[180px] flex items-center border border-parchment-line bg-parchment focus-within:border-gold">
                    <input
                      type="number"
                      min={0}
                      inputMode="decimal"
                      value={manualPriceTotal}
                      onChange={(e) => setManualPriceTotal(e.target.value)}
                      placeholder={`напр. ${roomsResult?.rooms[selectedRoomIdx]?.totalEUR ?? (resort.hotels[calcHotelIdx]?.price ?? 0) * calcNights}`}
                      className="w-full font-sans text-sm text-ink bg-transparent px-2.5 py-2 focus:outline-none"
                    />
                    <span className="font-mono text-sm text-muted-foreground pr-2.5">€ общо</span>
                  </div>
                  <a
                    href={roomsResult?.bookingUrlWithDates ?? (resort.hotels[calcHotelIdx] ? bookingLink(resort.name, resort.hotels[calcHotelIdx].name) : "#")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11.5px] tracking-wide text-parchment bg-teal px-3.5 py-2 flex items-center whitespace-nowrap hover:bg-ink-soft transition-colors"
                  >
                    Виж в Booking →
                  </a>
                </div>
                <div className="mt-1.5 font-mono text-[10.5px] text-muted-foreground leading-relaxed">
                  Въведете цената, която реално виждате в Booking (или на офертата), за да съвпадне точно с калкулатора.
                </div>
              </>
            ) : (
              <></>
            )}
            {!manualPriceMode && (
            <>
            <label className="sr-only">Цена</label>
            <div className="flex flex-wrap gap-2">
              <div className="flex-1 min-w-[180px] font-sans text-sm text-ink bg-parchment border border-parchment-line px-2.5 py-2 flex items-center justify-between">
                {(() => {
                  const selected = roomsResult?.rooms[selectedRoomIdx] ?? null;
                  if (selected) {
                    return (
                      <>
                        <span>
                          <b>{fmt(selected.totalEUR)}€</b>{" "}
                          <span className="text-muted-foreground">
                            ({fmt(selected.perNightEUR)}€/нощ × {roomsResult!.nights})
                          </span>
                        </span>
                        <span className="font-mono text-[10.5px] tracking-wider uppercase text-teal font-semibold">
                          ● Booking
                        </span>
                      </>
                    );
                  }
                  if (roomsResult) {
                    return (
                      <>
                        <span>
                          <b>{fmt(roomsResult.estimateTotal)}€</b>{" "}
                          <span className="text-muted-foreground">
                            ({fmt(roomsResult.estimatePerNight)}€/нощ × {roomsResult.nights})
                          </span>
                        </span>
                        <span className="font-mono text-[10.5px] tracking-wider uppercase text-coral-dark">
                          оценка
                        </span>
                      </>
                    );
                  }
                  return (
                    <>
                      <span>{hotel ? `${fmt(hotel.price * calcNights)}€ (базова)` : "—"}</span>
                      <span className="font-mono text-[10.5px] tracking-wider uppercase text-muted-foreground">
                        натиснете „провери"
                      </span>
                    </>
                  );
                })()}
              </div>
              <button
                type="button"
                onClick={onCheckPrice}
                disabled={checkingPrice || !hotel}
                className="font-mono text-[11.5px] tracking-wide text-parchment bg-coral px-3.5 py-2 flex items-center whitespace-nowrap hover:bg-coral-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {checkingPrice ? "Проверявам..." : "Провери в Booking"}
              </button>
              <a
                href={roomsResult?.bookingUrlWithDates ?? (hotel ? bookingLink(resort.name, hotel.name) : "#")}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11.5px] tracking-wide text-parchment bg-teal px-3.5 py-2 flex items-center whitespace-nowrap hover:bg-ink-soft transition-colors"
              >
                Отворете →
              </a>
            </div>
            {roomsResult && (
              <div className="mt-1.5 font-mono text-[10.5px] text-muted-foreground">
                {roomsResult.note}
              </div>
            )}

            {roomsResult && roomsResult.rooms.length > 0 && (
              <div className="mt-2.5">
                <div className="font-mono text-[10.5px] tracking-wide uppercase text-muted-foreground mb-1.5">
                  Изберете тип стая ({roomsResult.rooms.length})
                </div>
                <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto pr-1">
                  {roomsResult.rooms.map((room, i) => {
                    const active = i === selectedRoomIdx;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onSelectRoomIdx(i)}
                        className={`text-left border px-3 py-2 transition-colors cursor-pointer ${
                          active
                            ? "border-teal bg-parchment shadow-[inset_3px_0_0_0_#145C5A]"
                            : "border-parchment-line bg-parchment/60 hover:border-gold"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium text-ink truncate">
                              {room.roomType}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                              <span>{room.guests} възр.</span>
                              {room.mealPlan && <span>· {room.mealPlan}</span>}
                              {room.refundable && <span className="text-teal">· безпл. отказ</span>}
                              {room.dealLabel && <span className="text-coral-dark">· {room.dealLabel}</span>}
                            </div>
                          </div>
                          <div className="font-mono text-[13.5px] font-medium text-ink whitespace-nowrap">
                            {fmt(room.totalEUR)}€
                            <div className="text-[10px] text-muted-foreground font-normal text-right">
                              {fmt(room.perNightEUR)}€/нощ
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            </>
            )}
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
            {Math.max(0, 3 - covered)} по подразбиране са сметнати като излизане навън — може да промените числото по-горе.
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

        <div className="text-[11.5px] text-muted-foreground mt-5 leading-relaxed pt-4 border-t border-parchment-line space-y-2">
          <p>
            Натиснете <b>„Провери в Booking"</b> за реалната цена по избраните дати — извличаме всички налични стаи и техните тотални цени.
          </p>
          <p>
            <b>Защо понякога цените се разминават с Booking?</b> Booking няма отворено API — нямаме официално партньорство с тях, затова четем цените директно от страницата. Показаните суми зависят от типа стая, промоции (Genius, Getaway Deal), страна и текущата наличност, така че може да има малки разлики. Ако видите друго число в Booking, натиснете <b>„Въведи ръчно"</b> и въведете точната сума — калкулаторът ще я използва вместо оценката.
          </p>
          <p>
            <b>⚠️ Проверете наличността сами:</b> тъй като нямаме договор с Booking за официално API, не можем да гарантираме, че стаята е свободна за избрания период. Преди да планирате, моля отворете хотела в <b>Booking.com</b> (или сайта за резервации, който ползвате) и се уверете, че има свободни стаи за тези дати.
          </p>
        </div>
      </div>
    </>
  );
}
