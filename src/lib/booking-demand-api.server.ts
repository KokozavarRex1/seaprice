// Booking.com Demand API v3.2 client — server-only.
// Docs: https://developers.booking.com/demand/docs
//
// Изисква secrets:
//   BOOKING_AFFILIATE_ID  — Affiliate ID (число, изпраща се като X-Affiliate-Id header)
//   BOOKING_API_TOKEN     — Bearer token
//   BOOKING_API_ENV       — "production" | "sandbox" (по подразбиране sandbox)
//
// Забележка: v3.2 спецификацията НЕ предоставя search endpoints за атракции и такси.
// Те съществуват само в /orders/details за post-booking reporting.
// Достъпни модули за търсене: Accommodations, Cars.

const PROD_BASE = "https://demandapi.booking.com/3.2";
const SANDBOX_BASE = "https://demandapi-sandbox.booking.com/3.2";

export type BookingEnv = "production" | "sandbox";

export interface BookingCredentials {
  affiliateId: string;
  token: string;
  env: BookingEnv;
}

export function loadBookingCredentials(): BookingCredentials {
  const affiliateId = process.env.BOOKING_AFFILIATE_ID;
  const token = process.env.BOOKING_API_TOKEN;
  const env = (process.env.BOOKING_API_ENV as BookingEnv) || "sandbox";
  if (!affiliateId || !token) {
    throw new Error(
      "Липсват Booking API credentials. Добавете BOOKING_AFFILIATE_ID и BOOKING_API_TOKEN като secrets.",
    );
  }
  return { affiliateId, token, env };
}

export async function bookingRequest<T = unknown>(
  path: string,
  body: unknown,
  creds?: BookingCredentials,
): Promise<T> {
  const c = creds ?? loadBookingCredentials();
  const base = c.env === "production" ? PROD_BASE : SANDBOX_BASE;
  const url = `${base}${path}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${c.token}`,
      "X-Affiliate-Id": c.affiliateId,
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Booking API ${path} върна ${res.status}: ${text.slice(0, 500)}`,
    );
  }
  return (await res.json()) as T;
}

// ---------- Accommodations ----------

export interface AccommodationSearchInput {
  checkin: string; // YYYY-MM-DD
  checkout: string; // YYYY-MM-DD
  city?: number;
  country?: string;
  region?: number;
  accommodations?: number[]; // конкретни hotel IDs
  booker: {
    country: string; // ISO 3166-1 alpha-2, напр. "bg"
    platform: "desktop" | "mobile" | "tablet";
    travel_purpose?: "leisure" | "business";
  };
  guests: {
    number_of_adults: number;
    number_of_rooms: number;
    number_of_children?: number;
    children?: { age: number }[];
  };
  currency?: string; // ISO 4217, напр. "EUR"
  extras?: Array<"extra_charges" | "products" | "cancellation_details">;
}

export function searchAccommodations(input: AccommodationSearchInput) {
  return bookingRequest("/accommodations/search", input);
}

export function getAccommodationAvailability(input: AccommodationSearchInput) {
  return bookingRequest("/accommodations/availability", input);
}

export function getAccommodationDetails(input: {
  accommodations: number[];
  languages?: string[];
  extras?: string[];
}) {
  return bookingRequest("/accommodations/details", input);
}

export function getAccommodationReviews(input: {
  accommodations: number[];
  limit?: number;
  offset?: number;
}) {
  return bookingRequest("/accommodations/reviews", input);
}

export function getAccommodationReviewScores(input: { accommodations: number[] }) {
  return bookingRequest("/accommodations/reviews/scores", input);
}

// ---------- Cars ----------

export interface CarSearchInput {
  pickup: {
    airport?: string; // IATA
    location?: { latitude: number; longitude: number };
    datetime: string; // ISO 8601
  };
  dropoff: {
    airport?: string;
    location?: { latitude: number; longitude: number };
    datetime: string;
  };
  driver: { age: number; country: string };
  currency?: string;
}

export function searchCars(input: CarSearchInput) {
  return bookingRequest("/cars/search", input);
}

export function getCarDetails(input: { products: string[] }) {
  return bookingRequest("/cars/details", input);
}

// ---------- Common / locations ----------

export function findCities(input: { name?: string; country?: string }) {
  return bookingRequest("/common/locations/cities", input);
}

export function findCountries(input: Record<string, unknown> = {}) {
  return bookingRequest("/common/locations/countries", input);
}

export function findRegions(input: { country?: string; name?: string }) {
  return bookingRequest("/common/locations/regions", input);
}

export function findAirports(input: { name?: string; country?: string }) {
  return bookingRequest("/common/locations/airports", input);
}

// ---------- Orders (post-booking) ----------
// Атракции и такси се появяват като елементи в тези отговори.

export function previewOrder(input: Record<string, unknown>) {
  return bookingRequest("/orders/preview", input);
}

export function getOrderDetails(input: { order_ids: string[] }) {
  return bookingRequest("/orders/details", input);
}
