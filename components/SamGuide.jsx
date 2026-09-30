"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { stripLocale } from "@/lib/i18n";

// Tour guidato della home: SAM si sposta da un elemento all'altro, illumina
// quello di cui parla e oscura il resto. Alla prima visita lo propone con un
// fumetto; fuori dal tour resta una linguetta discreta sul bordo destro.
const STEPS = ["near", "types", "pin", "list", "suggest"];
const STORAGE_KEY = "sam:tour";
const PAD = 8;
const BUBBLE_W = 300;

function readChoice() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return "unavailable";
  }
}

function saveChoice(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {}
}

const visible = (el) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
};

// Il pin da illuminare: quello più vicino al centro della parte di mappa che
// non è coperta da filtri e pannello.
function findPin() {
  const list = document.querySelector('[data-tour="list"]')?.getBoundingClientRect();
  const floor = list && list.left < 10 ? list.top : window.innerHeight;
  const left = list && list.left >= 10 ? list.right : 0;
  const cx = (left + window.innerWidth) / 2;
  const cy = (140 + floor) / 2;
  let best = null;
  let bestD = Infinity;
  for (const el of document.querySelectorAll(".leaflet-marker-icon.sam-dot")) {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    if (x < left + 20 || x > window.innerWidth - 20 || y < 140 || y > floor - 20) continue;
    const d = Math.hypot(x - cx, y - cy);
    if (d < bestD) {
      bestD = d;
      best = el;
    }
  }
  return best;
}

function findTarget(key) {
  if (key === "pin") return findPin();
  return [...document.querySelectorAll(`[data-tour="${key}"]`)].find(visible) || null;
}

export default function SamGuide() {
  const { t } = useI18n();
  const pathname = stripLocale(usePathname() || "/");
  const onHome = pathname === "/";

  // "idle" | "propose" | "tour"
  const [mode, setMode] = useState("idle");
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);

  // Alla prima visita della home, SAM propone il tour dopo un attimo.
  useEffect(() => {
    if (!onHome || readChoice()) return;
    const id = setTimeout(() => setMode("propose"), 1500);
    return () => clearTimeout(id);
  }, [onHome]);

  const close = useCallback((choice) => {
    saveChoice(choice);
    setMode("idle");
    setRect(null);
  }, []);

  const measure = useCallback(() => {
    const el = findTarget(STEPS[step]);
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
  }, [step]);

  useLayoutEffect(() => {
    if (mode !== "tour") return;
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [mode, measure]);

  useEffect(() => {
    if (mode !== "tour") return;
    const onKey = (e) => {
      if (e.key === "Escape") close("done");
      if (e.key === "ArrowRight") setStep((s) => Math.min(s + 1, STEPS.length - 1));
      if (e.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, close]);

  if (!onHome) return null;

  const last = step === STEPS.length - 1;
  const content = t.guide.steps[STEPS[step]];

  // Fumetto sotto l'elemento se c'è spazio, altrimenti sopra; SAM accanto.
  let bubble = null;
  if (mode === "tour") {
    const vw = typeof window !== "undefined" ? window.innerWidth : 390;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const w = Math.min(BUBBLE_W, vw - 24);
    const target = rect || { top: vh / 2, left: vw / 2, width: 0, height: 0 };
    const below = target.top + target.height + 230 < vh;
    const left = Math.max(12, Math.min(target.left + target.width / 2 - w / 2, vw - w - 12));
    bubble = below
      ? { top: target.top + target.height + 12, left, width: w }
      : { top: Math.max(12, target.top - 12 - 210), left, width: w };
  }

  return (
    <>
      {mode === "idle" && (
        <button
          type="button"
          onClick={() => setMode("propose")}
          aria-label={t.guide.open}
          title={t.guide.open}
          className="fixed right-0 top-1/2 z-[1100] flex h-10 w-10 -translate-y-1/2 translate-x-3 items-center justify-center rounded-l-full bg-sam-paper/90 opacity-70 shadow-card ring-1 ring-sam-cream transition hover:translate-x-0 hover:opacity-100 focus-visible:translate-x-0 focus-visible:opacity-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/sam-icon.svg" alt="" className="h-8 w-8 -translate-x-1" />
        </button>
      )}

      {mode === "propose" && (
        <div
          role="dialog"
          aria-label={t.guide.open}
          className="fixed right-3 top-1/2 z-[1150] flex w-[280px] max-w-[calc(100vw-24px)] -translate-y-1/2 items-start gap-3 rounded-3xl bg-white p-4 shadow-card-hover ring-1 ring-sam-cream"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/sam-icon.svg" alt="" className="h-12 w-12 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-sam-green">{t.guide.propose}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setStep(0);
                  setMode("tour");
                }}
              >
                {t.guide.yes}
              </button>
              <button type="button" className="btn-outline" onClick={() => close("dismissed")}>
                {t.guide.no}
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === "tour" && (
        <div className="fixed inset-0 z-[1150]">
          {/* Blocca i click sotto: il tour si usa solo con i suoi bottoni. */}
          <div className="absolute inset-0" onClick={() => close("done")} aria-hidden />
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-2xl ring-2 ring-sam-yellow transition-all duration-300 ease-out"
            style={
              rect
                ? { ...rect, boxShadow: "0 0 0 9999px rgba(20, 30, 25, 0.62)" }
                : { top: "50%", left: "50%", width: 0, height: 0, boxShadow: "0 0 0 9999px rgba(20, 30, 25, 0.62)" }
            }
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sam-tour-title"
            className="absolute rounded-3xl bg-white p-4 shadow-card-hover transition-all duration-300 ease-out"
            style={bubble}
          >
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/sam-icon.svg" alt="" className="h-11 w-11 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 id="sam-tour-title" className="font-display text-base font-bold text-sam-green">
                    {content.title}
                  </h2>
                  <button
                    type="button"
                    onClick={() => close("done")}
                    aria-label={t.guide.close}
                    className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sam-muted hover:bg-sam-cream"
                  >
                    ✕
                  </button>
                </div>
                <p className="mt-1 text-sm leading-snug text-sam-brown/90">{content.text}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-sam-muted">{t.guide.counter(step + 1, STEPS.length)}</span>
              <div className="flex gap-2">
                {step > 0 && (
                  <button type="button" onClick={() => setStep(step - 1)} className="btn-outline">
                    {t.guide.back}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (last ? close("done") : setStep(step + 1))}
                  className="btn-primary"
                >
                  {last ? t.guide.done : t.guide.next}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
