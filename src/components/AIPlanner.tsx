import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generatePlan, type TravelPlan } from "@/lib/planner.functions";
import { resorts } from "@/data/resorts";

const EXAMPLES = [
  "Имам бюджет 800€ за двама за 5 дни.",
  "1500€ за семейство от 4 души, 7 нощувки, все едно къде.",
  "Евтина ваканция за 2 души с 400€, 4 нощувки в България.",
];

export function AIPlanner({ onSelectResort }: { onSelectResort: (id: string) => void }) {
  const runPlan = useServerFn(generatePlan);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<TravelPlan | null>(null);

  const submit = async (text?: string) => {
    const value = (text ?? prompt).trim();
    if (!value || loading) return;
    setPrompt(value);
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const result = await runPlan({ data: { prompt: value } });
      setPlan(result as TravelPlan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при генериране");
    } finally {
      setLoading(false);
    }
  };

  const openResort = () => {
    if (plan && resorts.some((r) => r.id === plan.resort_id)) {
      onSelectResort(plan.resort_id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <section className="border-t border-parchment-line bg-ink text-parchment">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-[10.5px] tracking-[2px] uppercase text-gold">
            AI Planner · v1
          </span>
          <span className="h-px flex-1 bg-gold/25" />
        </div>
        <h2 className="font-serif text-[32px] sm:text-[40px] font-medium leading-tight max-w-2xl">
          Кажете ни бюджета —&nbsp; ние ще Ви планираме ваканцията.
        </h2>
        <p className="text-parchment/60 text-sm mt-3 max-w-xl leading-relaxed">
          Хотел, транспорт, ресторанти и атракции — всичко в едно, съобразено с парите Ви.
        </p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8">
          {/* Input */}
          <div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Напр.: Имам бюджет 800€ за двама за 5 дни."
              rows={5}
              className="w-full bg-parchment/5 border border-gold/30 focus:border-gold outline-none text-parchment placeholder:text-parchment/35 font-mono text-sm p-4 rounded-none resize-none transition-colors"
              disabled={loading}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => submit(ex)}
                  disabled={loading}
                  className="font-mono text-[10.5px] tracking-wider uppercase text-gold-soft border border-gold/25 hover:border-gold hover:bg-gold/10 px-2.5 py-1.5 transition-colors disabled:opacity-40"
                >
                  {ex.length > 44 ? ex.slice(0, 42) + "…" : ex}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => submit()}
              disabled={loading || prompt.trim().length < 3}
              className="mt-5 w-full bg-gold text-ink font-mono text-xs tracking-[2px] uppercase py-4 hover:bg-gold-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Планирам…" : "Направете план"}
            </button>
            {error && (
              <div className="mt-4 border border-coral/60 bg-coral/10 text-coral-light font-mono text-xs p-3">
                {error}
              </div>
            )}
          </div>

          {/* Output */}
          <div className="min-h-[320px] border border-gold/25 bg-parchment/[0.03] p-6 sm:p-8">
            {!plan && !loading && (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <div className="w-10 h-10 mx-auto border border-gold rounded-full relative mb-3">
                    <div className="absolute top-1/2 left-[10%] right-[10%] h-px bg-gold -translate-y-1/2" />
                    <div className="absolute left-1/2 top-[10%] bottom-[10%] w-px bg-gold -translate-x-1/2" />
                  </div>
                  <p className="font-mono text-[11px] tracking-wider uppercase text-parchment/50">
                    Вашият план ще се появи тук
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="h-full flex items-center justify-center">
                <div className="font-mono text-xs tracking-wider uppercase text-gold-soft animate-pulse">
                  AI мисли…
                </div>
              </div>
            )}

            {plan && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="font-mono text-[10.5px] tracking-[1.8px] uppercase text-gold">
                      Препоръка
                    </div>
                    <div className="font-serif text-[26px] font-medium mt-1 leading-tight">
                      {plan.resort_name}
                    </div>
                    <div className="text-parchment/60 text-sm mt-0.5">{plan.hotel_name}</div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-mono text-[10px] tracking-wider uppercase ${
                        plan.within_budget ? "text-gold" : "text-coral-light"
                      }`}
                    >
                      {plan.within_budget ? "В бюджета" : "Над бюджета"}
                    </div>
                    <div className="font-serif text-[28px] font-medium leading-none mt-1">
                      {Math.round(plan.grand_total)} <span className="text-sm text-parchment/50">€</span>
                    </div>
                    <div className="font-mono text-[10px] text-parchment/40 mt-1">
                      бюджет: {Math.round(plan.budget)} €
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-gold/20 pt-4">
                  <Stat label="Хотел" value={plan.hotel_total} note={`${plan.nights} нощ. × ${plan.hotel_price_per_night}€`} />
                  <Stat label="Транспорт" value={plan.transport_total} note={`${plan.people} души`} />
                  <Stat label="Ресторанти" value={plan.restaurants_total} note="по нива, вижте долу" />
                  <Stat label="Атракции" value={plan.attractions_total} />
                </div>

                {plan.attractions.length > 0 && (
                  <div>
                    <div className="font-mono text-[10.5px] tracking-[1.8px] uppercase text-gold-soft mb-2">
                      Атракции
                    </div>
                    <ul className="space-y-2">
                      {plan.attractions.map((a, i) => (
                        <li key={i} className="flex items-start justify-between gap-3 text-sm border-b border-parchment/10 pb-2">
                          <div>
                            <div className="text-parchment">{a.name}</div>
                            <div className="text-parchment/50 text-xs mt-0.5">{a.description}</div>
                          </div>
                          <div className="font-mono text-xs text-gold-soft whitespace-nowrap">
                            {a.estimated_price_per_person}€/чов.
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <div className="font-mono text-[10.5px] tracking-[1.8px] uppercase text-gold-soft mb-2">
                    План за ресторанти ({plan.nights} нощувки)
                  </div>
                  <ul className="text-sm space-y-1">
                    {[
                      { label: "Бързо хранене", days: plan.dining_plan.fast_food_days, price: plan.dining_plan.fast_food_price_per_person },
                      { label: "Приличен ресторант", days: plan.dining_plan.mid_range_days, price: plan.dining_plan.mid_range_price_per_person },
                      { label: "Скъп ресторант", days: plan.dining_plan.fine_dining_days, price: plan.dining_plan.fine_dining_price_per_person },
                    ].map((row, i) => (
                      <li key={i} className="flex justify-between border-b border-parchment/10 pb-1">
                        <span className="text-parchment/85">
                          {row.label} · <b>{row.days}</b> {row.days === 1 ? "ден" : "дни"}
                        </span>
                        <span className="font-mono text-xs text-parchment/55">
                          {row.price}€/чов. · {Math.round(row.days * row.price * plan.people)}€ общо
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-parchment/70 text-sm leading-relaxed border-l-2 border-gold pl-3 italic">
                  {plan.summary}
                </p>
                <p className="text-parchment/50 text-xs">{plan.transport_note}</p>

                <button
                  type="button"
                  onClick={openResort}
                  className="w-full border border-gold text-gold hover:bg-gold hover:text-ink font-mono text-[11px] tracking-[2px] uppercase py-3 transition-colors"
                >
                  Отворете {plan.resort_name} на картата →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-wider uppercase text-parchment/50">{label}</div>
      <div className="font-serif text-lg mt-0.5">{Math.round(value)} <span className="text-xs text-parchment/50">€</span></div>
      {note && <div className="font-mono text-[10px] text-parchment/40 mt-0.5">{note}</div>}
    </div>
  );
}
