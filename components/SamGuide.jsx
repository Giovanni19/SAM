"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { stripLocale } from "@/lib/i18n";

// La mascotte di SAM che sbuca dal bordo destro: toccandola si apre una guida
// in pochi passi su come usare il sito. Solo nella parte studio, non in Work.
export default function SamGuide() {
  const { t } = useI18n();
  const pathname = stripLocale(usePathname() || "/");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const steps = t.guide.steps;
  const last = step === steps.length - 1;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") setStep((s) => Math.min(s + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, steps.length]);

  if (pathname === "/work" || pathname.startsWith("/work/")) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setStep(0);
          setOpen(true);
        }}
        aria-label={t.guide.open}
        title={t.guide.open}
        className="fixed right-0 top-1/2 z-[1100] flex h-14 w-14 -translate-y-1/2 translate-x-5 items-center justify-center rounded-l-full bg-sam-paper shadow-card-hover ring-1 ring-sam-cream transition-transform hover:translate-x-1 focus-visible:translate-x-1"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/sam-icon.svg" alt="" className="h-11 w-11 -translate-x-1.5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[1200] flex items-end justify-center p-4 sm:items-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sam-guide-title"
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-card-hover"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.guide.close}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-sam-muted hover:bg-sam-cream"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/sam-icon.svg" alt="" className="h-12 w-12" />
              <p className="text-xs font-bold uppercase tracking-wide text-sam-muted">
                {t.guide.counter(step + 1, steps.length)}
              </p>
            </div>

            <h2 id="sam-guide-title" className="mt-4 font-display text-xl font-bold text-sam-green">
              {steps[step].title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-sam-brown/90">{steps[step].text}</p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1.5" aria-hidden>
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-2 rounded-full transition-all ${i === step ? "w-5 bg-sam-green" : "w-2 bg-sam-cream"}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {step > 0 && (
                  <button type="button" onClick={() => setStep(step - 1)} className="btn-outline">
                    {t.guide.back}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (last ? setOpen(false) : setStep(step + 1))}
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
