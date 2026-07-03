export interface Hotel {
  name: string;
  /** Базова цена/нощ в € (използва се като fallback при неуспешен scrape и за сезонна оценка). */
  price: number;
  meta: string;
  board: "all_inclusive" | "half_board" | "breakfast" | "none";
  /** Директен URL към обявата в Booking (по избор). Ако е зададен, се използва за scraping. */
  bookingUrl?: string;
  stars?: 1 | 2 | 3 | 4 | 5;
  description?: string;
  images?: string[];
}

export interface PriceItem {
  name: string;
  price: number;
  meta: string;
}

export interface Transport {
  mode: string;
  price: number;
  time: string;
}

export interface TaxiRates {
  /** Такса пуск / повикване (€) */
  start: number;
  /** Дневна тарифа (€/км) */
  dayPerKm: number;
  /** Нощна тарифа (€/км), обикновено 22:00–06:00 */
  nightPerKm: number;
  /** Кратък източник за прозрачност */
  source?: string;
}

export interface Resort {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  hotels: Hotel[];
  taxi: PriceItem[];
  taxiRates: TaxiRates;
  parking: PriceItem[];
  restaurants: PriceItem[];
  /** Фиксирана средна цена за човек в приличен ресторант (основно + напитка), €. Не се променя от потребителя. */
  avgMealEUR: number;
  transport: Record<string, Transport>;
}

export const resorts: Resort[] = [
  {
    id: "sunny-beach",
    name: "Слънчев бряг",
    country: "България",
    lat: 42.685,
    lng: 27.7,
    hotels: [
      {
        name: "Galeon Residence & SPA",
        price: 110,
        meta: "5★ · закуска включена",
        board: "breakfast",
        stars: 5,
        bookingUrl: "https://www.booking.com/hotel/bg/galeon-apart-complex.html",
        description:
          "Galeon Residence & SPA се намира в Слънчев бряг, на 200 м от Черно море. Комплексът предлага климатизирани помещения с достъп до отопляем открит басейн и фитнес зона. Всички единици са самостоятелни и разполагат с балкон и мини-бар.",
        images: [
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/564463181.jpg?k=44d39e59eee5a35cda6d11364ef7b60c3807feb662125eb4378b136586082856&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/692077872.jpg?k=8256ddc2a8c210f67ac7d7456ff7a224cf893000a2484334c595e98ef98b3521&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/107725277.jpg?k=9415549776eacbf0932aa0bd21375bf5d5bd698c6edb390232b838f315c03899&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/700650195.jpg?k=1f9dfca9940f8fadc7ed7ae2164d295757b1a4432dee48454cf9551630d32461&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/707001450.jpg?k=118a79f0e0592918cfd02d49e8cd05d51e57f2167a0eee524b74dc4a3da6faab&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/316864570.jpg?k=340a9318158d2dded4307a53e23803c44249596c1de2cbd88a7892cf628a7b73&o=",
        ],
      },
      {
        name: "Imperial Palace Hotel",
        price: 95,
        meta: "4★ · закуска включена · на плажа",
        board: "breakfast",
        stars: 4,
        bookingUrl:
          "https://www.booking.com/hotel/bg/victoria-palace-sunny-beach.bg.html?aid=2311236&label=bg-bg-booking-desktop-bU08anLY8k2xF1ChP%2Aw6RAS652796015184%3Apl%3Ata%3Ap1%3Ap2%3Aac%3Aap%3Aneg%3Afi%3Atikwd-65526620%3Alp1001462%3Ali%3Adec%3Adm-Share-Eipho7%401783060290-Share-BvGdX8u%401783060367&sid=5773d5064d3a36c86d5ec231b21959af&dest_id=900039405&dest_type=city&dist=0&group_adults=2&group_children=0&hapos=1&hpos=1&no_rooms=1&req_adults=2&req_children=0&room1=A%2CA&sb_price_type=total&sr_order=popularity&srepoch=1783060482&srpvid=7ab62e0a85720111&type=total&ucfs=1&",
        description:
          "Imperial Palace Hotel се намира само на 30 м от плажа в Слънчев бряг и предлага релакс зона с масажи, сауна и турска баня. Всички стаи са с климатик, кабелна телевизия и балкон, като повечето разкриват гледка към Черно море. Комплексът разполага с открит басейн с безплатни шезлонги и чадъри, ресторант с национална и международна кухня и 5 бара. Златни пясъци е на около 100 км на север.",
        images: [
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/213816844.jpg",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/213816853.jpg",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/213816860.jpg",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/213816869.jpg",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/213843516.jpg",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/150382873.jpg",
        ],
      },
    ],
    taxi: [
      { name: "Старт", price: 2.5, meta: "такса пуск" },
      { name: "На километър", price: 1.2, meta: "дневна тарифа" },
    ],
    taxiRates: { start: 1.0, dayPerKm: 0.5, nightPerKm: 0.65, source: "Общински тарифи Слънчев бряг / Numbeo BG" },
    parking: [
      { name: "Централен паркинг", price: 3, meta: "на час" },
      { name: "Хотелски паркинг", price: 15, meta: "на ден" },
    ],
    restaurants: [
      { name: "Основно ястие", price: 20, meta: "средна цена" },
      { name: "Обяд край плажа", price: 14, meta: "средна цена" },
    ],
    avgMealEUR: 20,
    transport: {
      sofia: { mode: "автобус", price: 25, time: "7ч" },
      plovdiv: { mode: "автобус", price: 20, time: "5ч" },
      varna: { mode: "такси/бус", price: 15, time: "1ч" },
    },
  },
  {
    id: "sozopol",
    name: "Созопол",
    country: "България",
    lat: 42.417,
    lng: 27.7,
    hotels: [
      { name: "Стара къща", price: 75, meta: "3★ · бутиков", board: "none" },
      { name: "Морски бриз", price: 115, meta: "4★ · закуска включена", board: "breakfast" },
    ],
    taxi: [
      { name: "Старт", price: 2.5, meta: "такса пуск" },
      { name: "На километър", price: 1.3, meta: "дневна тарифа" },
    ],
    taxiRates: { start: 1.0, dayPerKm: 0.55, nightPerKm: 0.7, source: "Такси Созопол / Numbeo BG" },
    parking: [
      { name: "Паркинг стар град", price: 4, meta: "на час" },
      { name: "Извън центъра", price: 10, meta: "на ден" },
    ],
    restaurants: [
      { name: "Рибен ресторант", price: 28, meta: "средна цена" },
      { name: "Таверна", price: 18, meta: "средна цена" },
    ],
    avgMealEUR: 25,
    transport: {
      sofia: { mode: "автобус", price: 27, time: "7.5ч" },
      plovdiv: { mode: "автобус", price: 22, time: "5.5ч" },
      varna: { mode: "бус", price: 18, time: "1.5ч" },
    },
  },
  {
    id: "golden-sands",
    name: "Златни пясъци",
    country: "България",
    lat: 43.286,
    lng: 28.043,
    hotels: [
      { name: "International Hotel", price: 105, meta: "4★ · all inclusive", board: "all_inclusive" },
      { name: "Admiral Hotel", price: 140, meta: "5★ · all inclusive", board: "all_inclusive" },
    ],
    taxi: [
      { name: "Старт", price: 2.0, meta: "такса пуск" },
      { name: "На километър", price: 1.0, meta: "дневна тарифа" },
    ],
    taxiRates: { start: 0.9, dayPerKm: 0.45, nightPerKm: 0.6, source: "Такси Златни пясъци / Numbeo BG" },
    parking: [{ name: "Централен паркинг", price: 3, meta: "на час" }],
    restaurants: [{ name: "Основно ястие", price: 24, meta: "средна цена" }],
    avgMealEUR: 24,
    transport: {
      sofia: { mode: "автобус", price: 28, time: "7ч" },
      plovdiv: { mode: "автобус", price: 23, time: "5.5ч" },
      varna: { mode: "бус", price: 5, time: "30мин" },
    },
  },
  {
    id: "kavala",
    name: "Кавала",
    country: "Гърция",
    lat: 40.939,
    lng: 24.402,
    hotels: [
      { name: "Kavala Port Hotel", price: 75, meta: "3★ · закуска включена", board: "breakfast" },
      { name: "Egnatia Suites", price: 120, meta: "4★ · all inclusive", board: "all_inclusive" },
    ],
    taxi: [
      { name: "Старт", price: 3.5, meta: "такса пуск" },
      { name: "На километър", price: 1.0, meta: "дневна тарифа" },
    ],
    taxiRates: { start: 1.3, dayPerKm: 0.9, nightPerKm: 1.25, source: "Такси Кавала / Numbeo GR" },
    parking: [
      { name: "Централен паркинг", price: 2, meta: "на час" },
      { name: "Хотелски паркинг", price: 12, meta: "на ден" },
    ],
    restaurants: [{ name: "Основно ястие (тавернa)", price: 15, meta: "средна цена" }],
    avgMealEUR: 15,
    transport: {
      sofia: { mode: "кола/бус", price: 35, time: "5ч" },
      plovdiv: { mode: "кола/бус", price: 30, time: "4ч" },
      varna: { mode: "кола", price: 45, time: "6ч" },
    },
  },
  {
    id: "thassos",
    name: "Тасос (Лименас)",
    country: "Гърция",
    lat: 40.782,
    lng: 24.712,
    hotels: [
      { name: "Thassos Bay", price: 90, meta: "4★ · закуска включена", board: "breakfast" },
      { name: "Island Studios", price: 50, meta: "студио · без храна", board: "none" },
    ],
    taxi: [
      { name: "Старт", price: 3.5, meta: "такса пуск" },
      { name: "На километър", price: 1.1, meta: "дневна тарифа" },
    ],
    taxiRates: { start: 1.3, dayPerKm: 0.9, nightPerKm: 1.25, source: "Такси Тасос / Numbeo GR" },
    parking: [{ name: "Пристанищен паркинг", price: 2.5, meta: "на час" }],
    restaurants: [{ name: "Рибен ресторант", price: 20, meta: "средна цена" }],
    avgMealEUR: 20,
    transport: {
      sofia: { mode: "кола + ферибот", price: 45, time: "6.5ч" },
      plovdiv: { mode: "кола + ферибот", price: 40, time: "5.5ч" },
      varna: { mode: "кола + ферибот", price: 55, time: "7.5ч" },
    },
  },
  {
    id: "sithonia",
    name: "Ситония",
    country: "Гърция",
    lat: 40.19,
    lng: 23.88,
    hotels: [
      { name: "Sithonia Retreat", price: 130, meta: "5★ · all inclusive", board: "all_inclusive" },
      { name: "Pine Bay Rooms", price: 60, meta: "3★ · без храна", board: "none" },
    ],
    taxi: [
      { name: "Старт", price: 3.5, meta: "такса пуск" },
      { name: "На километър", price: 1.1, meta: "дневна тарифа" },
    ],
    taxiRates: { start: 1.3, dayPerKm: 0.9, nightPerKm: 1.25, source: "Такси Ситония / Numbeo GR" },
    parking: [{ name: "Плажен паркинг", price: 3, meta: "на ден" }],
    restaurants: [{ name: "Основно ястие", price: 16, meta: "средна цена" }],
    avgMealEUR: 22,
    transport: {
      sofia: { mode: "кола/бус", price: 55, time: "7ч" },
      plovdiv: { mode: "кола/бус", price: 50, time: "6ч" },
      varna: { mode: "кола", price: 60, time: "8ч" },
    },
  },
  {
    id: "kusadasi",
    name: "Кушадасъ",
    country: "Турция",
    lat: 37.858,
    lng: 27.259,
    hotels: [
      { name: "Aegean Palm", price: 85, meta: "4★ · all inclusive", board: "all_inclusive" },
      { name: "Marina View", price: 55, meta: "3★ · закуска включена", board: "breakfast" },
    ],
    taxi: [
      { name: "Старт", price: 2.0, meta: "такса пуск" },
      { name: "На километър", price: 0.8, meta: "дневна тарифа" },
    ],
    taxiRates: { start: 0.7, dayPerKm: 0.55, nightPerKm: 0.6, source: "Такси Кушадасъ / Numbeo TR" },
    parking: [{ name: "Централен паркинг", price: 2, meta: "на час" }],
    restaurants: [{ name: "Основно ястие", price: 10, meta: "средна цена" }],
    avgMealEUR: 12,
    transport: {
      sofia: { mode: "самолет", price: 90, time: "3ч" },
      plovdiv: { mode: "самолет (през Истанбул)", price: 110, time: "5ч" },
      varna: { mode: "самолет", price: 95, time: "3.5ч" },
    },
  },
  {
    id: "marmaris",
    name: "Мармарис",
    country: "Турция",
    lat: 36.855,
    lng: 28.274,
    hotels: [
      { name: "Marmaris Sea Resort", price: 100, meta: "4★ · all inclusive", board: "all_inclusive" },
      { name: "Old Town Inn", price: 45, meta: "2★ · без храна", board: "none" },
    ],
    taxi: [
      { name: "Старт", price: 2.0, meta: "такса пуск" },
      { name: "На километър", price: 0.8, meta: "дневна тарифа" },
    ],
    taxiRates: { start: 0.7, dayPerKm: 0.55, nightPerKm: 0.6, source: "Такси Мармарис / Numbeo TR" },
    parking: [{ name: "Пристанищен паркинг", price: 2.5, meta: "на час" }],
    restaurants: [{ name: "Основно ястие", price: 11, meta: "средна цена" }],
    avgMealEUR: 13,
    transport: {
      sofia: { mode: "самолет", price: 100, time: "3.5ч" },
      plovdiv: { mode: "самолет", price: 115, time: "4.5ч" },
      varna: { mode: "самолет", price: 105, time: "4ч" },
    },
  },
  {
    id: "bodrum",
    name: "Бодрум",
    country: "Турция",
    lat: 37.034,
    lng: 27.43,
    hotels: [
      { name: "Bodrum White Villas", price: 140, meta: "5★ · полупансион", board: "half_board" },
      { name: "Harbor Rooms", price: 60, meta: "3★ · закуска включена", board: "breakfast" },
    ],
    taxi: [
      { name: "Старт", price: 2.2, meta: "такса пуск" },
      { name: "На километър", price: 0.9, meta: "дневна тарифа" },
    ],
    taxiRates: { start: 0.75, dayPerKm: 0.6, nightPerKm: 0.65, source: "Такси Бодрум / Numbeo TR" },
    parking: [{ name: "Централен паркинг", price: 2.5, meta: "на час" }],
    restaurants: [{ name: "Основно ястие", price: 13, meta: "средна цена" }],
    avgMealEUR: 18,
    transport: {
      sofia: { mode: "самолет", price: 105, time: "3.5ч" },
      plovdiv: { mode: "самолет", price: 120, time: "4.5ч" },
      varna: { mode: "самолет", price: 110, time: "4ч" },
    },
  },
];

export const tabs = [
  { key: "hotels", label: "Хотели" },
  { key: "taxi", label: "Таксита" },
  { key: "parking", label: "Паркинг" },
  { key: "restaurants", label: "Ресторанти" },
  { key: "transport", label: "Транспорт" },
] as const;

export const boardMeals: Record<string, number> = {
  all_inclusive: 3,
  half_board: 2,
  breakfast: 1,
  none: 0,
};

export const boardLabels: Record<string, string> = {
  all_inclusive: "All inclusive · 3 хранения включени",
  half_board: "Полупансион · 2 хранения включени",
  breakfast: "Закуска включена · 1 хранене включено",
  none: "Без хранене · 0 включени",
};

export const startLabels: Record<string, string> = {
  sofia: "От София",
  plovdiv: "От Пловдив",
  varna: "От Варна",
};

export function bookingLink(resortName: string, hotelName: string): string {
  const query = encodeURIComponent(hotelName + " " + resortName);
  return `https://www.booking.com/searchresults.html?ss=${query}`;
}

export function fmt(n: number): string {
  return n.toFixed(0);
}
