export interface Hotel {
  name: string;
  price: number;
  meta: string;
  board: "all_inclusive" | "half_board" | "breakfast" | "none";
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

export interface Resort {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  hotels: Hotel[];
  taxi: PriceItem[];
  parking: PriceItem[];
  restaurants: PriceItem[];
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
      { name: "Хотел Марина", price: 65, meta: "3★ · закуска включена", board: "breakfast" },
      { name: "Аква Резорт", price: 110, meta: "4★ · all inclusive", board: "all_inclusive" },
      { name: "Бриз Апартаменти", price: 42, meta: "студио · без храна", board: "none" },
    ],
    taxi: [
      { name: "Старт", price: 2.5, meta: "такса пуск" },
      { name: "На километър", price: 1.2, meta: "дневна тарифа" },
    ],
    parking: [
      { name: "Централен паркинг", price: 3, meta: "на час" },
      { name: "Хотелски паркинг", price: 15, meta: "на ден" },
    ],
    restaurants: [
      { name: "Основно ястие", price: 12, meta: "средна цена" },
      { name: "Обяд край плажа", price: 8, meta: "средна цена" },
    ],
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
      { name: "Стара къща", price: 55, meta: "3★ · бутиков", board: "none" },
      { name: "Морски бриз", price: 80, meta: "4★ · закуска включена", board: "breakfast" },
    ],
    taxi: [
      { name: "Старт", price: 2.5, meta: "такса пуск" },
      { name: "На километър", price: 1.3, meta: "дневна тарифа" },
    ],
    parking: [
      { name: "Паркинг стар град", price: 4, meta: "на час" },
      { name: "Извън центъра", price: 10, meta: "на ден" },
    ],
    restaurants: [
      { name: "Рибен ресторант", price: 18, meta: "средна цена" },
      { name: "Таверна", price: 11, meta: "средна цена" },
    ],
    transport: {
      sofia: { mode: "автобус", price: 27, time: "7.5ч" },
      plovdiv: { mode: "автобус", price: 22, time: "5.5ч" },
      varna: { mode: "бус", price: 18, time: "1.5ч" },
    },
  },
  {
    id: "nessebar",
    name: "Несебър",
    country: "България",
    lat: 42.659,
    lng: 27.736,
    hotels: [
      { name: "Стар град Резиденс", price: 70, meta: "3★ · полупансион", board: "half_board" },
      { name: "Панорама Хотел", price: 95, meta: "4★ · закуска включена", board: "breakfast" },
    ],
    taxi: [
      { name: "Старт", price: 2.5, meta: "такса пуск" },
      { name: "На километър", price: 1.2, meta: "дневна тарифа" },
    ],
    parking: [{ name: "Паркинг вход стар град", price: 3.5, meta: "на час" }],
    restaurants: [{ name: "Основно ястие", price: 13, meta: "средна цена" }],
    transport: {
      sofia: { mode: "автобус", price: 25, time: "7ч" },
      plovdiv: { mode: "автобус", price: 20, time: "5ч" },
      varna: { mode: "такси", price: 14, time: "1ч" },
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
    parking: [
      { name: "Централен паркинг", price: 2, meta: "на час" },
      { name: "Хотелски паркинг", price: 12, meta: "на ден" },
    ],
    restaurants: [{ name: "Основно ястие (тавернa)", price: 15, meta: "средна цена" }],
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
    parking: [{ name: "Пристанищен паркинг", price: 2.5, meta: "на час" }],
    restaurants: [{ name: "Рибен ресторант", price: 20, meta: "средна цена" }],
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
    parking: [{ name: "Плажен паркинг", price: 3, meta: "на ден" }],
    restaurants: [{ name: "Основно ястие", price: 16, meta: "средна цена" }],
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
    parking: [{ name: "Централен паркинг", price: 2, meta: "на час" }],
    restaurants: [{ name: "Основно ястие", price: 10, meta: "средна цена" }],
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
    parking: [{ name: "Пристанищен паркинг", price: 2.5, meta: "на час" }],
    restaurants: [{ name: "Основно ястие", price: 11, meta: "средна цена" }],
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
    parking: [{ name: "Централен паркинг", price: 2.5, meta: "на час" }],
    restaurants: [{ name: "Основно ястие", price: 13, meta: "средна цена" }],
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
  { key: "transport", label: "Как да стигна" },
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
