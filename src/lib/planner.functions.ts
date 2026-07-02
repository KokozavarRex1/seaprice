import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { resorts } from "@/data/resorts";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const planSchema = z.object({
  resort_id: z.string(),
  resort_name: z.string(),
  hotel_name: z.string(),
  hotel_price_per_night: z.number(),
  nights: z.number(),
  people: z.number(),
  hotel_total: z.number(),
  transport_total: z.number(),
  transport_note: z.string(),
  restaurants: z.array(
    z.object({
      name: z.string(),
      avg_price_per_person: z.number(),
    }),
  ),
  restaurants_total: z.number(),
  attractions: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      estimated_price_per_person: z.number(),
    }),
  ),
  attractions_total: z.number(),
  grand_total: z.number(),
  budget: z.number(),
  within_budget: z.boolean(),
  summary: z.string(),
});

export type TravelPlan = z.infer<typeof planSchema>;

export const generatePlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ prompt: z.string().min(3).max(1000) }).parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const catalog = resorts.map((r) => ({
      id: r.id,
      name: r.name,
      country: r.country,
      hotels: r.hotels.map((h) => ({ name: h.name, price_eur: h.price, meta: h.meta, board: h.board })),
      avg_meal_eur_per_person: r.avgMealEUR,
      transport_eur: r.transport,
    }));

    const gateway = createLovableAiGatewayProvider(key);
    const system = `Вие сте AI планер за морска почивка. Отговаряте САМО на български език.
ВСИЧКИ цени са в ЕВРО (€). Не използвайте лева.
Избирате ЕДИН курорт и хотел от предоставения каталог, който най-добре пасва на бюджета (в €).

ВАЖНО ЗА РЕСТОРАНТИТЕ:
- Средната цена за ресторант на човек е ФИКСИРАНА за всеки курорт: полето "avg_meal_eur_per_person" в каталога.
- НЕ измисляйте, НЕ променяйте тази цена. Използвайте точната стойност от каталога.
- Върнете в "restaurants" 2-3 примерни ресторанта за избрания курорт, като avg_price_per_person = avg_meal_eur_per_person на курорта (една и съща цена).
- restaurants_total = avg_meal_eur_per_person * people * nights (по една вечеря навън на ден).

Пресмятания:
- hotel_total = hotel_price_per_night * nights
- transport_total = цена за избрания старт (най-разумният от каталога) * people (двупосочно, ако е разумно)
- attractions_total = сума на estimated_price_per_person * people
- grand_total = hotel_total + transport_total + restaurants_total + attractions_total

Предложете 3-5 реални атракции за курорта (плажове, забележителности, екскурзии) с реалистична цена в €.
grand_total трябва да е <= budget когато е възможно. Ако бюджетът е малък, изберете най-евтината комбинация и поставете within_budget=false.`;

    const userPrompt = `Заявка на потребителя: "${data.prompt}"
(Ако потребителят е дал бюджет в лева, преобразувай в евро с курс 1€ = 1.95583 лв.)

Каталог с курорти (JSON, всички цени в €):
${JSON.stringify(catalog, null, 2)}

Върни САМО валиден JSON обект (без markdown), всички суми в €:
resort_id, resort_name, hotel_name, hotel_price_per_night, nights, people, hotel_total, transport_total, transport_note, restaurants (array of {name, avg_price_per_person}), restaurants_total, attractions (array of {name, description, estimated_price_per_person}), attractions_total, grand_total, budget, within_budget, summary.`;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system,
      prompt: userPrompt,
    });

    const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    const start = cleaned.search(/[\{\[]/);
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new Error("AI не върна валиден JSON. Опитайте отново.");
    }
    const jsonText = cleaned.substring(start, end + 1);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error("AI не върна валиден JSON. Опитайте отново.");
    }
    const result = planSchema.safeParse(parsed);
    if (!result.success) {
      console.error("Plan validation failed:", result.error.message, jsonText.slice(0, 500));
      throw new Error("AI планът не съответства на схемата. Опитайте отново.");
    }

    // Server-side lock: enforce the fixed per-resort restaurant price.
    // The user cannot change it and the AI cannot invent a different value.
    const plan = result.data;
    const resort = resorts.find((r) => r.id === plan.resort_id);
    if (resort) {
      const fixed = resort.avgMealEUR;
      plan.restaurants = plan.restaurants.map((r) => ({
        ...r,
        avg_price_per_person: fixed,
      }));
      plan.restaurants_total = fixed * plan.people * plan.nights;
      plan.grand_total =
        plan.hotel_total + plan.transport_total + plan.restaurants_total + plan.attractions_total;
      plan.within_budget = plan.grand_total <= plan.budget;
    }
    return plan;
  });
