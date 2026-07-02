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

export interface RoomOffer {
  roomType: string;
  guests: number;
  totalEUR: number;
  perNightEUR: number;
  mealPlan?: string | null;
  refundable?: boolean | null;
  dealLabel?: string | null;
}

export interface BookingRoomsResult {
  nights: number;
  source: PriceSource;
  /** Съобщение за UI. */
  note: string;
  /** URL, който води до Booking с попълнени дати. */
  bookingUrlWithDates: string;
  /** Всички налични стаи от Booking (сортирани по цена). Празен масив при неуспех. */
  rooms: RoomOffer[];
  /** Използва се, ако rooms е празен — сезонна оценка за целия престой. */
  estimateTotal: number;
  estimatePerNight: number;
}

function nightsBetween(checkin: string, checkout: string): number {
  const a = new Date(checkin + "T00:00:00Z").getTime();
  const b = new Date(checkout + "T00:00:00Z").getTime();
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

/** Сезонен коефициент: юли/авг x1.5, юни/сеп x1.2, май/окт x0.95, иначе x0.75. */
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

export const getBookingRooms = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<BookingRoomsResult> => {
    const nights = nightsBetween(data.checkin, data.checkout);
    const bookingUrlWithDates = buildBookingUrlWithDates(
      data.bookingUrl,
      data.hotelName,
      data.resortName,
      data.checkin,
      data.checkout,
      data.adults,
    );

    const mult = seasonalMultiplier(data.checkin);
    const estimatePerNight = Math.round(data.basePrice * mult);
    const estimateTotal = estimatePerNight * nights;

    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey || !data.bookingUrl) {
      return {
        nights,
        source: "estimate",
        note: data.bookingUrl
          ? "Firecrawl не е конфигуриран. Показваме сезонна оценка."
          : "Няма директен линк към Booking — показваме оценка.",
        bookingUrlWithDates,
        rooms: [],
        estimateTotal,
        estimatePerNight,
      };
    }

    try {
      const { default: Firecrawl } = await import("@mendable/firecrawl-js");
      const fc = new Firecrawl({ apiKey });
      const scrape = await fc.scrape(bookingUrlWithDates, {
        formats: [
          {
            type: "json",
            prompt: `From the Availability table on this Booking.com hotel page for the exact dates ${data.checkin} to ${data.checkout} (${nights} nights, ${data.adults} adults, 1 room), extract EVERY room offer listed. For each row return: roomType (string), guests (number of adults it fits), totalEUR (total price for the WHOLE stay in EUR — NOT per night; ignore struck-through / crossed-out prices, use the current price), mealPlan (short string like "Breakfast included", "Room only", or null), refundable (true if free cancellation is offered, false otherwise), dealLabel (short label like "Getaway Deal 20% off" or null). Dedupe identical rows. Return { rooms: [...] }. If no availability shown, return { rooms: [] }.`,
          },
        ],
        onlyMainContent: false,
        waitFor: 5000,
        location: { country: "BG", languages: ["bg", "en"] },
      });

      type RawRoom = {
        roomType?: string;
        guests?: number;
        totalEUR?: number | null;
        mealPlan?: string | null;
        refundable?: boolean | null;
        dealLabel?: string | null;
      };
      const json =
        (scrape as { json?: { rooms?: RawRoom[] } }).json ||
        (scrape as { data?: { json?: { rooms?: RawRoom[] } } }).data?.json;
      const raw = json?.rooms ?? [];

      const rooms: RoomOffer[] = raw
        .filter(
          (r): r is RawRoom & { roomType: string; totalEUR: number } =>
            typeof r?.roomType === "string" &&
            typeof r?.totalEUR === "number" &&
            r.totalEUR >= 20 &&
            r.totalEUR <= nights * 2000,
        )
        .map((r) => ({
          roomType: r.roomType,
          guests: typeof r.guests === "number" ? r.guests : data.adults,
          totalEUR: Math.round(r.totalEUR),
          perNightEUR: Math.round(r.totalEUR / nights),
          mealPlan: r.mealPlan ?? null,
          refundable: r.refundable ?? null,
          dealLabel: r.dealLabel ?? null,
        }))
        .sort((a, b) => a.totalEUR - b.totalEUR);

      if (rooms.length === 0) {
        return {
          nights,
          source: "estimate",
          note: "Booking не върна стаи за тези дати (може да е разпродадено). Показваме сезонна оценка.",
          bookingUrlWithDates,
          rooms: [],
          estimateTotal,
          estimatePerNight,
        };
      }

      return {
        nights,
        source: "booking",
        note: `${rooms.length} налични ${rooms.length === 1 ? "стая" : "стаи"} от Booking · изберете типа, за да съвпадне точно.`,
        bookingUrlWithDates,
        rooms,
        estimateTotal,
        estimatePerNight,
      };
    } catch (err) {
      console.error("[getBookingRooms] scrape failed", err);
      return {
        nights,
        source: "estimate",
        note: "Неуспешно извличане от Booking. Показваме оценка.",
        bookingUrlWithDates,
        rooms: [],
        estimateTotal,
        estimatePerNight,
      };
    }
  });
