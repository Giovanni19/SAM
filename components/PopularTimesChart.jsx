"use client";

import { useState } from "react";

const DAYS = [
  { key: "mon", label: "Lun" },
  { key: "tue", label: "Mar" },
  { key: "wed", label: "Mer" },
  { key: "thu", label: "Gio" },
  { key: "fri", label: "Ven" },
  { key: "sat", label: "Sab" },
  { key: "sun", label: "Dom" },
];

function barColor(score) {
  if (score >= 70) return "bg-sam-coral";
  if (score >= 40) return "bg-sam-yellow";
  if (score > 0) return "bg-sam-green";
  return "bg-sam-cream";
}

/** Grafico affollamento (popular times) per fascia oraria, con selettore giorno. */
export default function PopularTimesChart({ popularTimes }) {
  const availableDays = DAYS.filter((d) => popularTimes[d.key]);
  const todayKey = DAYS[(new Date().getDay() + 6) % 7].key; // lun=0 ... dom=6
  const defaultDay = availableDays.find((d) => d.key === todayKey) || availableDays[0];
  const [day, setDay] = useState(defaultDay.key);

  const scores = popularTimes[day] || [];

  return (
    <div className="rounded-2xl border border-sam-cream bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display font-semibold text-sam-green">Quanto è affollato</h3>
        <div className="flex flex-wrap gap-1">
          {availableDays.map((d) => (
            <button
              key={d.key}
              onClick={() => setDay(d.key)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                d.key === day
                  ? "bg-sam-green text-sam-paper"
                  : "bg-sam-paper text-sam-brown hover:bg-sam-cream"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex h-24 items-end gap-[3px]">
        {scores.map((score, hour) => (
          <div key={hour} className="group relative flex-1">
            <div
              className={`w-full rounded-t-sm ${barColor(score)}`}
              style={{ height: `${Math.max(score, 3)}%` }}
              title={`${hour}:00 — ${score > 0 ? `${score}% affollamento` : "dati non disponibili"}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-sam-muted">
        <span>0</span>
        <span>6</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
      </div>
      <p className="mt-2 text-xs text-sam-muted">Stima Google Maps, basata sulle visite abituali.</p>
    </div>
  );
}
