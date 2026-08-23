"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";

// Solo le chiavi: le etichette (abbreviata e per esteso) arrivano dal
// dizionario, così il grafico parla la lingua della pagina.
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function barColor(score) {
  if (score >= 70) return "bg-sam-coral";
  if (score >= 40) return "bg-sam-yellow";
  if (score > 0) return "bg-sam-green";
  return "bg-sam-cream";
}

const hh = (h) => `${String(h).padStart(2, "0")}:00`;

/** Grafico affollamento (dati storici Google Maps) con asse Y e barre cliccabili. */
export default function PopularTimesChart({ popularTimes }) {
  const { t } = useI18n();
  const availableDays = DAY_KEYS.filter(
    (key) => Array.isArray(popularTimes?.[key]) && popularTimes[key].length
  );
  const todayKey = DAY_KEYS[(new Date().getDay() + 6) % 7]; // lun=0 ... dom=6
  const defaultDay = availableDays.find((key) => key === todayKey) || availableDays[0] || "";
  const [day, setDay] = useState(defaultDay);
  const [selected, setSelected] = useState(null); // ora selezionata (0–23)

  if (!availableDays.length) {
    return (
      <div className="rounded-2xl border border-sam-cream bg-white p-5 text-sm text-sam-muted">
        {t.detail.noCrowding}
      </div>
    );
  }

  const activeDay = availableDays.includes(day) ? day : defaultDay;
  const scores = popularTimes[activeDay] || [];
  const selScore = selected != null ? scores[selected] ?? 0 : null;

  function pick(hour) {
    setSelected((prev) => (prev === hour ? null : hour));
  }

  return (
    <div className="rounded-2xl border border-sam-cream bg-white p-5">
      {/* Selettore giorno. Niente titolo qui dentro: la sezione che ospita il
          grafico ha già il proprio <h2> con lo stesso testo (t.detail.crowding),
          e ripeterlo lo mostrava due volte di fila. */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="flex flex-wrap gap-1">
          {availableDays.map((key) => (
            <button
              key={key}
              onClick={() => {
                setDay(key);
                setSelected(null);
              }}
              aria-pressed={key === activeDay}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                key === activeDay
                  ? "bg-sam-green text-sam-paper"
                  : "bg-sam-paper text-sam-brown hover:bg-sam-cream"
              }`}
            >
              {t.days[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Nota fascia selezionata */}
      <div className="mt-3 min-h-[2.25rem] rounded-xl bg-sam-paper px-3 py-2 text-sm">
        {selected == null ? (
          <span className="text-sam-muted">{t.crowd.hint}</span>
        ) : (
          <span className="text-sam-brown">
            <span className="font-semibold text-sam-green">{t.daysFull[activeDay]}</span>{" "}
            {hh(selected)}–{hh((selected + 1) % 24)} ·{" "}
            {selScore > 0 ? (
              <>
                <span className="font-bold text-sam-green">{selScore}%</span> {t.crowd.busyness}
              </>
            ) : (
              <span className="text-sam-muted">{t.crowd.quiet}</span>
            )}
          </span>
        )}
      </div>

      {/* Asse Y + barre */}
      <div className="mt-3 flex gap-2">
        {/* Asse Y */}
        <div className="flex h-28 w-9 flex-col justify-between py-0 text-right text-[10px] text-sam-muted">
          <span>100%</span>
          <span>50%</span>
          <span>0%</span>
        </div>

        {/* Area barre con griglia orizzontale */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            <div className="border-t border-sam-cream" />
            <div className="border-t border-dashed border-sam-cream" />
            <div className="border-t border-sam-cream" />
          </div>

          <div className="relative flex h-28 items-end gap-[3px]">
            {scores.map((score, hour) => {
              const dim = selected != null && selected !== hour;
              const active = selected === hour;
              return (
                <button
                  key={hour}
                  type="button"
                  onClick={() => pick(hour)}
                  aria-label={t.crowd.barLabel(hh(hour), score)}
                  className="flex h-full flex-1 items-end"
                >
                  <div
                    className={`w-full rounded-t-sm transition-all ${barColor(score)} ${
                      dim ? "opacity-30" : "opacity-100"
                    } ${active ? "ring-2 ring-sam-green ring-offset-1" : ""}`}
                    style={{ height: `${Math.max(score, 2)}%` }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Asse X (ore) — allineato con l'area barre */}
      <div className="mt-1 flex gap-2">
        <div className="w-9" />
        <div className="flex flex-1 justify-between text-[10px] text-sam-muted">
          <span>0</span><span>6</span><span>12</span><span>18</span><span>23</span>
        </div>
      </div>

      {/* Spiegazione */}
      <p className="mt-3 border-t border-sam-cream pt-3 text-xs leading-relaxed text-sam-muted">
        <span className="font-semibold text-sam-brown">{t.crowd.sourceLead}</span>
        {t.crowd.sourceMiddle}
        <span className="font-semibold">{t.crowd.sourceStrong}</span>
        {t.crowd.sourceTail}
      </p>
    </div>
  );
}
