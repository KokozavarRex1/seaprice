// Server functions обвиващи Booking Demand API.
type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
// Извикват се от компоненти чрез useServerFn или директно от loaders.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  searchAccommodations,
  getAccommodationDetails,
  searchCars,
  findCities,
  type AccommodationSearchInput,
  type CarSearchInput,
} from "./booking-demand-api.server";

// -------- Accommodations search --------

const accommodationSearchSchema = z.object({
  checkin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkout: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  city: z.number().optional(),
  country: z.string().length(2).optional(),
  region: z.number().optional(),
  adults: z.number().int().min(1).max(30).default(2),
  rooms: z.number().int().min(1).max(30).default(1),
  currency: z.string().length(3).default("EUR"),
  bookerCountry: z.string().length(2).default("bg"),
});

export const searchBookingAccommodations = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => accommodationSearchSchema.parse(input))
  .handler(async ({ data }) => {
    const body: AccommodationSearchInput = {
      checkin: data.checkin,
      checkout: data.checkout,
      city: data.city,
      country: data.country,
      region: data.region,
      booker: { country: data.bookerCountry, platform: "desktop" },
      guests: {
        number_of_adults: data.adults,
        number_of_rooms: data.rooms,
      },
      currency: data.currency,
      extras: ["extra_charges", "products"],
    };
    return (await searchAccommodations(body)) as JsonValue;
  });

// -------- Accommodation details --------

export const getBookingAccommodationDetails = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        accommodations: z.array(z.number().int()).min(1).max(100),
        languages: z.array(z.string()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => (await getAccommodationDetails(data)) as JsonValue);

// -------- Cars --------

const carSearchSchema = z.object({
  pickupAirport: z.string().length(3).optional(),
  dropoffAirport: z.string().length(3).optional(),
  pickupDatetime: z.string(),
  dropoffDatetime: z.string(),
  driverAge: z.number().int().min(18).max(99).default(30),
  driverCountry: z.string().length(2).default("bg"),
  currency: z.string().length(3).default("EUR"),
});

export const searchBookingCars = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => carSearchSchema.parse(input))
  .handler(async ({ data }) => {
    const body: CarSearchInput = {
      pickup: {
        airport: data.pickupAirport,
        datetime: data.pickupDatetime,
      },
      dropoff: {
        airport: data.dropoffAirport ?? data.pickupAirport,
        datetime: data.dropoffDatetime,
      },
      driver: { age: data.driverAge, country: data.driverCountry },
      currency: data.currency,
    };
    return (await searchCars(body)) as JsonValue;
  });

// -------- Locations helper --------

export const findBookingCity = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ name: z.string().min(2), country: z.string().length(2).optional() }).parse(input),
  )
  .handler(async ({ data }) => (await findCities(data)) as JsonValue);

// -------- Автомапинг с оценка на увереност --------

export interface CityCandidate {
  id: number;
  name: string;
  country?: string;
  region?: string;
}

export interface CityResolution {
  candidates: CityCandidate[];
  /** Ако има точно едно съвпадение или едно точно текстово съвпадение — селектиран автоматично. */
  autoSelected: CityCandidate | null;
  /** Причина за (не)автомапинг — за UI съобщение. */
  reason: "single_match" | "exact_name_match" | "ambiguous" | "no_match" | "api_unavailable";
  /** Ако API не е конфигуриран или е върнал грешка. */
  error?: string;
}

function normalizeName(v: string): string {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zа-я0-9\s]/gi, "")
    .trim();
}

export const resolveBookingCity = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().min(2),
        country: z.string().length(2).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<CityResolution> => {
    let raw: unknown;
    try {
      raw = await findCities(data);
    } catch (err) {
      return {
        candidates: [],
        autoSelected: null,
        reason: "api_unavailable",
        error: err instanceof Error ? err.message : "Booking API грешка",
      };
    }

    // Booking връща { data: [{ id, name, country, region, ... }, ...] }
    const items = ((raw as { data?: unknown[] })?.data ?? []) as Array<{
      id?: number;
      name?: string;
      country?: string;
      region?: { name?: string } | string;
    }>;
    const candidates: CityCandidate[] = items
      .filter((it) => typeof it.id === "number" && typeof it.name === "string")
      .map((it) => ({
        id: it.id as number,
        name: it.name as string,
        country: it.country,
        region: typeof it.region === "string" ? it.region : it.region?.name,
      }));

    if (candidates.length === 0) {
      return { candidates: [], autoSelected: null, reason: "no_match" };
    }
    if (candidates.length === 1) {
      return { candidates, autoSelected: candidates[0], reason: "single_match" };
    }
    const target = normalizeName(data.name);
    const exact = candidates.filter((c) => normalizeName(c.name) === target);
    if (exact.length === 1) {
      return { candidates, autoSelected: exact[0], reason: "exact_name_match" };
    }
    return { candidates, autoSelected: null, reason: "ambiguous" };
  });

