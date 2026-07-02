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

    // Опит за scrape чрез LLM JSON extraction (много по-точно от regex)
    try {
      const { default: Firecrawl } = await import("@mendable/firecrawl-js");
      const fc = new Firecrawl({ apiKey });
      const scrape = await fc.scrape(bookingUrlWithDates, {
        formats: [
          {
            type: "json",
            prompt: `From the Availability table on this Booking.com hotel page for the exact dates ${data.checkin} to ${data.checkout} (${nights} nights, ${data.adults} adults, 1 room), extract the LOWEST total price for the whole stay in EUR. Ignore per-night breakdowns, taxes shown separately, and prices for other date ranges. Return { totalEUR: number, roomType: string }. If no availability is shown for these exact dates, return { totalEUR: null }.`,
          },
        ],
        onlyMainContent: false,
        waitFor: 5000,
        location: { country: "BG", languages: ["bg", "en"] },
      });
      const json =
        (scrape as { json?: { totalEUR?: number | null; roomType?: string } }).json ||
        (scrape as { data?: { json?: { totalEUR?: number | null; roomType?: string } } }).data?.json;
      const total = json?.totalEUR;
      if (typeof total === "number" && total >= 20 && total <= nights * 2000) {
        const perNight = total / nights;
        return {
          total: Math.round(total),
          perNight: Math.round(perNight),
          nights,
          source: "booking",
          note: json?.roomType
            ? `Реална цена от Booking · ${json.roomType}`
            : "Реална цена от Booking за избраните дати.",
          bookingUrlWithDates,
        };
      }
      return {
        total: Math.round(estimateTotal),
        perNight: Math.round(estimatePerNight),
        nights,
        source: "estimate",
        note: "Booking не върна цена за тези дати (може да е разпродадено). Показваме оценка.",
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
