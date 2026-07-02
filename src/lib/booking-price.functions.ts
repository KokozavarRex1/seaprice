import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  hotelName: z.string(),
  resortName: z.string(),
  bookingUrl: z.string().optional(),
  basePrice: z.number(),
  checkin: z.string(), // YYYY-MM-DD
  checkout: z.string(), // YYYY-MM-DD
  adults: z.number().int().min(1).max(8),
});

export type PriceSource = "booking" | "estimate";

export interface HybridPriceResult {
  /** Обща сума за престоя в €. */
  total: number;
  /** Цена на нощ в €. */
  perNight: number;
  nights: number;
  source: PriceSource;
  /** Съобщение за UI (напр. защо е оценка). */
  note: string;
  /** URL, който води до Booking с попълнени дати. */
  bookingUrlWithDates: string;
}

function nightsBetween(checkin: string, checkout: string): number {
  const a = new Date(checkin + "T00:00:00Z").getTime();
  const b = new Date(checkout + "T00:00:00Z").getTime();
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

/** Сезонен коефициент: юли/авг x1.5, юни/сеп x1.2, иначе x1.0. */
function seasonalMultiplier(checkin: string): number {
  const month = new Date(checkin + "T00:00:00Z").getUTCMonth() + 1;
  if (month === 7 || month === 8) return 1.5;
  if (month === 6 || month === 9) return 1.2;
  if (month === 5 || month === 10) return 0.95;
  return 0.75;
}

function buildBookingUrlWithDates(
  bookingUrl: string | undefined,
  hotelName: string,
  resortName: string,
  checkin: string,
  checkout: string,
  adults: number,
): string {
  if (bookingUrl && bookingUrl.includes("booking.com")) {
    try {
      const u = new URL(bookingUrl);
      u.searchParams.set("checkin", checkin);
      u.searchParams.set("checkout", checkout);
      u.searchParams.set("group_adults", String(adults));
      u.searchParams.set("no_rooms", "1");
      u.searchParams.set("selected_currency", "EUR");
      return u.toString();
    } catch {
      // fall through
    }
  }
  const q = encodeURIComponent(`${hotelName} ${resortName}`);
  return `https://www.booking.com/searchresults.html?ss=${q}&checkin=${checkin}&checkout=${checkout}&group_adults=${adults}&no_rooms=1&selected_currency=EUR`;
}

/** Намира първата разумна цена в €/лв в markdown-a. */
function extractPriceFromMarkdown(markdown: string, nights: number): number | null {
  // Търсим "€ 123" / "EUR 123" / "123 €" / "123 EUR" / "лв 234" / "234 лв"
  const patterns = [
    /€\s*(\d{2,5}(?:[.,]\d{1,2})?)/g,
    /(\d{2,5}(?:[.,]\d{1,2})?)\s*€/g,
    /EUR\s*(\d{2,5}(?:[.,]\d{1,2})?)/gi,
    /(\d{2,5}(?:[.,]\d{1,2})?)\s*EUR/gi,
    /BGN\s*(\d{2,5}(?:[.,]\d{1,2})?)/gi,
    /(\d{2,5}(?:[.,]\d{1,2})?)\s*(?:лв|BGN)/gi,
  ];
  const candidates: number[] = [];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(markdown)) !== null) {
      const raw = m[1].replace(",", ".");
      const n = parseFloat(raw);
      if (!isFinite(n) || n < 20) continue;
      // Ако е BGN, превърни в €
      const isBgn = /лв|BGN/i.test(m[0]);
      const eur = isBgn ? n / 1.95583 : n;
      // Обхват: приемливо е между 20€/нощ и 3000€ за целия престой
      if (eur >= 20 && eur <= Math.max(3000, nights * 1500)) {
        candidates.push(eur);
      }
    }
  }
  if (candidates.length === 0) return null;
  // Взимаме най-малката (обикновено най-евтината налична стая = total price)
  candidates.sort((a, b) => a - b);
  return candidates[0];
}

export const getHybridPrice = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<HybridPriceResult> => {
    const nights = nightsBetween(data.checkin, data.checkout);
    const bookingUrlWithDates = buildBookingUrlWithDates(
      data.bookingUrl,
      data.hotelName,
      data.resortName,
      data.checkin,
      data.checkout,
      data.adults,
    );

    // Fallback оценка
    const mult = seasonalMultiplier(data.checkin);
    const estimatePerNight = data.basePrice * mult;
    const estimateTotal = estimatePerNight * nights;

    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey || !data.bookingUrl) {
      return {
        total: Math.round(estimateTotal),
        perNight: Math.round(estimatePerNight),
        nights,
        source: "estimate",
        note: data.bookingUrl
          ? "Оценка (сезонен коефициент). За реалната цена виж Booking."
          : "Няма директен линк за scraping — показваме оценка.",
        bookingUrlWithDates,
      };
    }

    // Опит за scrape
    try {
      const { default: Firecrawl } = await import("@mendable/firecrawl-js");
      const fc = new Firecrawl({ apiKey });
      const scrape = await fc.scrape(bookingUrlWithDates, {
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 2500,
        location: { country: "BG", languages: ["bg", "en"] },
      });
      const md =
        (scrape as { markdown?: string }).markdown ||
        (scrape as { data?: { markdown?: string } }).data?.markdown ||
        "";
      const price = extractPriceFromMarkdown(md, nights);
      if (price !== null) {
        // Booking често показва общата цена за престоя, но понякога и per-night.
        // Ако извлеченото е под 3x базовата → най-вероятно е /нощ; иначе е total.
        const looksPerNight = price < data.basePrice * 3;
        const total = looksPerNight ? price * nights : price;
        const perNight = total / nights;
        return {
          total: Math.round(total),
          perNight: Math.round(perNight),
          nights,
          source: "booking",
          note: "Реална цена от Booking за избраните дати.",
          bookingUrlWithDates,
        };
      }
      return {
        total: Math.round(estimateTotal),
        perNight: Math.round(estimatePerNight),
        nights,
        source: "estimate",
        note: "Booking не върна цена (може да е разпродадено). Показваме оценка.",
        bookingUrlWithDates,
      };
    } catch (err) {
      console.error("[getHybridPrice] scrape failed", err);
      return {
        total: Math.round(estimateTotal),
        perNight: Math.round(estimatePerNight),
        nights,
        source: "estimate",
        note: "Неуспешно извличане от Booking. Показваме оценка.",
        bookingUrlWithDates,
      };
    }
  });
