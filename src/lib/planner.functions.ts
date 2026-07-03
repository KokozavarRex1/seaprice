import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { resorts } from "@/data/resorts";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const diningPlanSchema = z.object({
  fast_food_days: z.number(),
  mid_range_days: z.number(),
  fine_dining_days: z.number(),
  fast_food_price_per_person: z.number(),
  mid_range_price_per_person: z.number(),
  fine_dining_price_per_person: z.number(),
});

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
  dining_plan: diningPlanSchema,
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
      dining_eur_per_person: r.dining,
      transport_eur: r.transport,
    }));

    const gateway = createLovableAiGatewayProvider(key);
    const system = `Вие сте AI планер за морска почивка. Отговаряте САМО на български език.
ВСИЧКИ цени са в ЕВРО (€). Не използвайте лева.
Избирате ЕДИН курорт и хотел от предоставения каталог, който най-добре пасва на бюджета (в €).

ВАЖНО ЗА РЕСТОРАНТИТЕ (три нива):
- Всеки курорт има три ФИКСИРАНИ цени/човек: dining_eur_per_person.fastFood (бързо хранене), midRange (приличен ресторант), fineDining (скъп ресторант).
- НЕ измисляйте други цени — използвайте точните стойности от каталога.
- Разпределете колко дни от общо nights потребителят ще яде на всяко ниво. Сборът fast_food_days + mid_range_days + fine_dining_days трябва да е <= nights.
- Ако бюджетът е тесен → повече бързо хранене. Ако е щедър → повече приличен/скъп ресторант.
- restaurants_total = (fast_food_days * fastFood + mid_range_days * midRange + fine_dining_days * fineDining) * people.

Пресмятания:
- hotel_total = hotel_price_per_night * nights
- transport_total = цена за избрания старт (най-разумният от каталога) * people (двупосочно, ако е разумно)
- attractions_total = сума на estimated_price_per_person * people
- grand_total = hotel_total + transport_total + restaurants_total + attractions_total

Предложете 3-5 реални атракции за курорта с реалистична цена в €.
grand_total трябва да е <= budget когато е възможно. Ако бюджетът е малък, изберете най-евтината комбинация и поставете within_budget=false.
В summary обяснете как разпределението по нива помага да се вмести в бюджета.`;

    const userPrompt = `Заявка на потребителя: "${data.prompt}"
(Ако потребителят е дал бюджет в лева, преобразувай в евро с курс 1€ = 1.95583 лв.)

Каталог с курорти (JSON, всички цени в €):
${JSON.stringify(catalog, null, 2)}

Върни САМО валиден JSON обект (без markdown), всички суми в €:
resort_id, resort_name, hotel_name, hotel_price_per_night, nights, people, hotel_total, transport_total, transport_note,
dining_plan: { fast_food_days, mid_range_days, fine_dining_days, fast_food_price_per_person, mid_range_price_per_person, fine_dining_price_per_person },
restaurants_total, attractions (array of {name, description, estimated_price_per_person}), attractions_total, grand_total, budget, within_budget, summary.`;

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

    // Server-side lock: enforce fixed per-resort dining prices.
    const plan = result.data;
    const resort = resorts.find((r) => r.id === plan.resort_id);
    if (resort) {
      const d = resort.dining;
      const dp = plan.dining_plan;
      dp.fast_food_price_per_person = d.fastFood;
      dp.mid_range_price_per_person = d.midRange;
      dp.fine_dining_price_per_person = d.fineDining;
      // Clamp negative or NaN
      dp.fast_food_days = Math.max(0, Math.round(dp.fast_food_days || 0));
      dp.mid_range_days = Math.max(0, Math.round(dp.mid_range_days || 0));
      dp.fine_dining_days = Math.max(0, Math.round(dp.fine_dining_days || 0));

      plan.restaurants_total =
        (dp.fast_food_days * d.fastFood +
          dp.mid_range_days * d.midRange +
          dp.fine_dining_days * d.fineDining) *
        plan.people;
      plan.grand_total =
        plan.hotel_total + plan.transport_total + plan.restaurants_total + plan.attractions_total;
      plan.within_budget = plan.grand_total <= plan.budget;
    }
    return plan;
  });
