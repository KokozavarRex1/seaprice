import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { resorts } from "@/data/resorts";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const planSchema = z.object({
  resort_id: z.string().describe("id на избрания курорт от списъка"),
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
  summary: z.string().describe("Кратко обяснение на плана на български"),
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
      hotels: r.hotels.map((h) => ({ name: h.name, price: h.price, meta: h.meta, board: h.board })),
      restaurants: r.restaurants,
      transport: r.transport,
    }));

    const gateway = createLovableAiGatewayProvider(key);
    const system = `Ти си AI планер за морска почивка. Отговаряш САМО на български език.
Избираш ЕДИН курорт и хотел от предоставения каталог, който най-добре пасва на бюджета.
Всички цени са в лева (BGN). Смятай реалистично:
- hotel_total = hotel_price_per_night * nights
- transport_total = цена за посочения старт * people (двупосочно, ако е разумно)
- restaurants_total = средна цена * people * (nights ~ вечери навън)
- attractions_total = сума на estimated_price_per_person * people
Предложи 3-5 реални атракции за избрания курорт (плажове, забележителности, ексурсии).
grand_total трябва да е <= budget когато е възможно. Ако бюджетът е твърде малък, избери най-евтината опция и постави within_budget=false.`;

    const userPrompt = `Заявка на потребителя: "${data.prompt}"

Каталог с курорти (JSON):
${JSON.stringify(catalog, null, 2)}

Върни САМО валиден JSON обект (без markdown, без \`\`\`) със следните полета:
resort_id, resort_name, hotel_name, hotel_price_per_night (number), nights (number), people (number), hotel_total (number), transport_total (number), transport_note (string), restaurants (array of {name, avg_price_per_person}), restaurants_total (number), attractions (array of {name, description, estimated_price_per_person}), attractions_total (number), grand_total (number), budget (number), within_budget (boolean), summary (string).`;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system,
      prompt: userPrompt,
    });

    const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    const start = cleaned.search(/[\{\[]/);
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new Error("AI не върна валиден JSON. Опитай отново.");
    }
    const jsonText = cleaned.substring(start, end + 1);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error("AI не върна валиден JSON. Опитай отново.");
    }
    const result = planSchema.safeParse(parsed);
    if (!result.success) {
      console.error("Plan validation failed:", result.error.message, jsonText.slice(0, 500));
      throw new Error("AI планът не съответства на схемата. Опитай отново.");
    }
    return result.data;
  });
