export interface Hotel {
  name: string;
  price: number;
  meta: string;
  board: "all_inclusive" | "half_board" | "breakfast" | "none";
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
  start: number;
  dayPerKm: number;
  nightPerKm: number;
  source?: string;
}

/** Три ценови нива за хранене на човек (€), базирани на средни цени за курорта. */
export interface DiningTiers {
  fastFood: number;
  midRange: number;
  fineDining: number;
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
  restaurants: PriceItem[];
  /** Три фиксирани ценови нива за ресторант (€/човек). */
  dining: DiningTiers;
  /** @deprecated Оставено за съвместимост — равно на dining.midRange. */
  avgMealEUR: number;
  transport: Record<string, Transport>;
}

export const diningTierLabels: Record<keyof DiningTiers, string> = {
  fastFood: "Бързо хранене",
  midRange: "Приличен ресторант",
  fineDining: "Скъп ресторант",
};

export const diningTierDescriptions: Record<keyof DiningTiers, string> = {
  fastFood: "Гирос, дюнер, пица на парче, стрийт фууд, бургер",
  midRange: "Механа/таверна · основно + напитка",
  fineDining: "Топ ресторант · вечеря с вино",
};

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
      {
        name: "Amara Sugar Hotel",
        price: 95,
        meta: "3★ · без хранене",
        board: "none",
        stars: 3,
        bookingUrl: "https://www.booking.com/hotel/bg/amara-sugar.html",
        description:
          "Amara Sugar Hotel се намира в Слънчев бряг, на по-малко от 1 км от плажа. Комплексът предлага климатизирани семейни стаи с балкон, кухненски бокс, работно бюро и безплатен WiFi. Разполага с целогодишен открит басейн, тераса и градина, ресторант с американска, италианска и местна кухня, бар и безплатен паркинг на място. Летище Бургас е на около 27 км.",
        images: [
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/306517851.jpg?k=b388c4efe9bf625279cc046aac5b8d5d4d49956247cbf0e0d2266fdee1219eeb&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/720669276.jpg?k=0c9800aa232c6994ba3c499b259dd434ffbae646584304c86fca8a3f381aa1e1&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/300474663.jpg?k=7a53c5b78e30e15af40786958f9a617283d6495755276a14cf40b295651c55b0&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/720670008.jpg?k=39c6468dafdbceac1c89c139a4d2d155547727c165c9803341258d83c71587ad&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/306517740.jpg?k=7076efd878c2d7e78934e1bce393d0bc144a20231cc1562f74f15f07ae30dfd8&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/720673211.jpg?k=d6116a8a23153a86cf7fd2a98dd0420f300971f8340edc884810a2d0838bafbd&o=",
        ],
      },
      {
        name: "Hotel Venus",
        price: 55,
        meta: "2★ · закуска включена",
        board: "breakfast",
        stars: 2,
        bookingUrl: "https://www.booking.com/hotel/bg/venera.html",
        description:
          "Hotel Venus се намира в центъра на Слънчев бряг, на около 200 м от плажа, и предлага открит басейн с безплатни чадъри и шезлонги, à la carte ресторант и безплатен WiFi в общите части. Всички стаи разполагат с балкон, телевизор с кабелни канали, хладилник и собствена баня с душ. Хотелът има 24-часова рецепция, градина, фризьорски салон и услуги за масаж срещу допълнително заплащане. Летище Бургас е на около 30 км.",
        images: [
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/199278772.jpg?k=adc31e7aadfb76ed7bd370dbac89e9e6cb16b981ce18474cfdd584b0ece8e0e0&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/49983227.jpg?k=f3646181303dca9b6e19a19766a6fe17bc2077467308033bb0953d2343d3711f&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/199275597.jpg?k=a4b98981e447eae5f473bfd2f6a69d0bbb91575380d978a3363d4a257c4795f9&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/49903341.jpg?k=af20e592b188a92923748214cd5dad41e1df49187b928d0e54dae8978d102de4&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/199280127.jpg?k=46ea71c70577a88ca44fbaf61eedb3e7d1f551501995162e6aea6a0c05521939&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/49979788.jpg?k=9e18283a1694083fe2196a5ba58bc638acaee45ead96f00b7fb489bd53a4ff99&o=",
        ],
      },
      {
        name: "Apartcomplex Panorama Dreams",
        price: 50,
        meta: "1★ · без хранене",
        board: "none",
        stars: 1,
        bookingUrl: "https://www.booking.com/hotel/bg/apartcomplex-panorama-dreams.html",
        description:
          "Apartcomplex Panorama Dreams се намира в спокоен район между Слънчев бряг и Свети Влас. Апартаментите са климатизирани, с балкон, кабелна телевизия, разтегателен диван, напълно оборудван кухненски бокс с трапезария и собствена баня. Комплексът разполага с ресторант с традиционна българска и международна кухня, открит басейн с бар, тенис корт, сауна, фитнес, маса за пинг-понг и билярд. Има супермаркет, медицинско обслужване и 24-часова охрана. Летище Бургас е на около 30 км, а безплатен паркинг е осигурен на място.",
        images: [
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/57104968.jpg?k=427bef27c14e140de6e5874295d53458baf7aa4f8cc4ac3fc463d7b2cfd0f5c0&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/345178824.jpg?k=40f945e5aea528f46113d56c7fd7d204ca502a2bccbb498957eca797f6806c4a&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/57105348.jpg?k=7de909370817f37d1b9d10c90fa829cc46addef415dfb43a633e64e4e370a81e&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/345178638.jpg?k=ec32a6062b5fc4a9f85856aa303ab9a91c5638c3840cb8306ab363bd1bad8e87&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/345187206.jpg?k=adebba56ed9803f3bd51242deec96ccd3e88217c9b0c8eb6390dd8ef481149cc&o=",
          "https://cf.bstatic.com/xdata/images/hotel/max1024x768/57105354.jpg?k=f208404ced24464b82dc8b0e40c8a26b022a075e5f1e183e53d6a1760fb2fec0&o=",
        ],
      },
    ],
    taxi: [
      { name: "Старт", price: 2.5, meta: "такса пуск" },
      { name: "На километър", price: 1.2, meta: "дневна тарифа" },
    ],
    taxiRates: { start: 1.0, dayPerKm: 0.5, nightPerKm: 0.65, source: "Общински тарифи Слънчев бряг / Numbeo BG" },
    restaurants: [
      { name: "Основно ястие", price: 20, meta: "средна цена" },
      { name: "Обяд край плажа", price: 14, meta: "средна цена" },
    ],
    dining: { fastFood: 8, midRange: 20, fineDining: 45 },
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
    restaurants: [
      { name: "Рибен ресторант", price: 28, meta: "средна цена" },
      { name: "Таверна", price: 18, meta: "средна цена" },
    ],
    dining: { fastFood: 10, midRange: 25, fineDining: 55 },
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
    restaurants: [{ name: "Основно ястие", price: 24, meta: "средна цена" }],
    dining: { fastFood: 9, midRange: 24, fineDining: 50 },
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
    restaurants: [{ name: "Основно ястие (тавернa)", price: 15, meta: "средна цена" }],
    dining: { fastFood: 7, midRange: 15, fineDining: 38 },
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
    restaurants: [{ name: "Рибен ресторант", price: 20, meta: "средна цена" }],
    dining: { fastFood: 9, midRange: 20, fineDining: 48 },
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
    restaurants: [{ name: "Основно ястие", price: 16, meta: "средна цена" }],
    dining: { fastFood: 10, midRange: 22, fineDining: 55 },
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
    restaurants: [{ name: "Основно ястие", price: 10, meta: "средна цена" }],
    dining: { fastFood: 5, midRange: 12, fineDining: 32 },
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
    restaurants: [{ name: "Основно ястие", price: 11, meta: "средна цена" }],
    dining: { fastFood: 6, midRange: 13, fineDining: 35 },
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
    restaurants: [{ name: "Основно ястие", price: 13, meta: "средна цена" }],
    dining: { fastFood: 7, midRange: 18, fineDining: 45 },
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
s;

export function bookingLink(resortName: string, hotelName: string): string {
  const query = encodeURIComponent(hotelName + " " + resortName);
  return `https://www.booking.com/searchresults.html?ss=${query}`;
}

export function fmt(n: number): string {
  return n.toFixed(0);
}
