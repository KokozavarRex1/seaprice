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
