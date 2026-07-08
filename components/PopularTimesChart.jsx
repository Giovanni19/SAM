"use client";

import { useState } from "react";

const DAYS = [
  { key: "mon", label: "Lun", full: "Lunedì" },
  { key: "tue", label: "Mar", full: "Martedì" },
  { key: "wed", label: "Mer", full: "Mercoledì" },
  { key: "thu", label: "Gio", full: "Giovedì" },
  { key: "fri", label: "Ven", full: "Venerdì" },
  { key: "sat", label: "Sab", full: "Sabato" },
  { key: "sun", label: "Dom", full: "Domenica" },
];

function barColor(score) {
  if (score >= 70) return "bg-sam-coral";
  if (score >= 40) return "bg-sam-yellow";
  if (score > 0) return "bg-sam-green";
  return "bg-sam-cream";
}

const hh = (h) => `${String(h).padStart(2, "0")}:00`;

/** Grafico affollamento (dati storici Google Maps) con asse Y e barre cliccabili. */
export default function PopularTimesChart({ popularTimes }) {
  const availableDays = DAYS.filter(
    (d) => Array.isArray(popularTimes?.[d.key]) && popularTimes[d.key].length
  );
  const todayKey = DAYS[(new Date().getDay() + 6) % 7].key; // lun=0 ... dom=6
  const defaultDay =
    availableDays.find((d) => d.key === todayKey)?.key || availableDays[0]?.key || "";
  const [day, setDay] = useState(defaultDay);
  const [selected, setSelected] = useState(null); // ora selezionata (0–23)

  if (!availableDays.length) {
    return (
      <div className="rounded-2xl border border-sam-cream bg-white p-5 text-sm text-sam-muted">
        Dati affluenza non disponibili.
      </div>
    );
  }

  const activeDay = availableDays.some((d) => d.key === day) ? day : defaultDay;
  const dayInfo = DAYS.find((d) => d.key === activeDay);
  const scores = popularTimes[activeDay] || [];
  const selScore = selected != null ? scores[selected] ?? 0 : null;

  function pick(hour) {
    setSelected((prev) => (prev === hour ? null : hour));
  }

  return (
    <div className="rounded-2xl border border-sam-cream bg-white p-5">
      {/* Intestazione + selettore giorno */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display font-semibold text-sam-green">Quanto è affollato</h3>
        <div className="flex flex-wrap gap-1">
          {availableDays.map((d) => (
            <button
              key={d.key}
              onClick={() => {
                setDay(d.key);
                setSelected(null);
              }}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                d.key === activeDay
                  ? "bg-sam-green text-sam-paper"
                  : "bg-sam-paper text-sam-brown hover:bg-sam-cream"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nota fascia selezionata */}
      <div className="mt-3 min-h-[2.25rem] rounded-xl bg-sam-paper px-3 py-2 text-sm">
        {selected == null ? (
          <span className="text-sam-muted">Tocca una barra per vedere l'orario e la percentuale esatti.</span>
        ) : (
          <span className="text-sam-brown">
            <span className="font-semibold text-sam-green">{dayInfo?.full}</span>{" "}
            {hh(selected)}–{hh((selected + 1) % 24)} ·{" "}
            {selScore > 0 ? (
              <><span className="font-bold text-sam-green">{selScore}%</span> di affollamento</>
            ) : (
              <span className="text-sam-muted">poco affollato o chiuso</span>
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
                  aria-label={`${hh(hour)} — ${score}% di affollamento`}
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
        <span className="font-semibold text-sam-brown">Dati storici di Google Maps</span>, non in tempo
        reale: sono la media delle visite passate in ogni fascia oraria. La percentuale indica
        quanto è pieno il locale <span className="font-semibold">rispetto alla sua ora di punta della
        settimana</span> (100% = massimo affollamento abituale, non capienza reale).
      </p>
    </div>
  );
}
