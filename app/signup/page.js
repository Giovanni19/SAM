"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import Link from "next/link";
import { signup } from "@/app/auth/actions";
import {
  OCCUPATIONS,
  MILAN_UNIVERSITIES,
  AGE_RANGES,
  ANALYTICS_CONSENT_LABEL,
} from "@/lib/profile";

const inputClass =
  "w-full rounded-xl border border-sam-cream bg-sam-paper px-4 py-2.5 text-sm outline-none focus:border-sam-green";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
      {pending ? "Attendere…" : "Crea account"}
    </button>
  );
}

export default function SignupPage() {
  const [state, action] = useFormState(signup, {});
  const [occupation, setOccupation] = useState("");
  // I dati di profilazione si raccolgono SOLO con consenso esplicito e separato.
  const [consentAnalytics, setConsentAnalytics] = useState(false);

  return (
    <div className="container-sam flex justify-center py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-bold text-sam-green">Crea il tuo account</h1>
        <p className="mt-1 text-sm text-sam-muted">
          Salva i tuoi posti preferiti e ritrovali su ogni dispositivo.
        </p>

        <form action={action} className="mt-6 space-y-3 rounded-2xl bg-white p-5 shadow-card">
          {/* --- Parte obbligatoria --- */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-sam-green">Nome</span>
              <input name="first_name" type="text" autoComplete="given-name" className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-sam-green">Cognome</span>
              <input name="last_name" type="text" autoComplete="family-name" className={inputClass} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-sam-green">Email</span>
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-sam-green">Password</span>
            <input name="password" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
            <span className="mt-1 block text-[11px] text-sam-muted">Almeno 6 caratteri.</span>
          </label>

          {/* --- Profilazione facoltativa, con consenso separato (GDPR) --- */}
          <div className="!mt-5 border-t border-sam-cream pt-4">
            <p className="text-xs font-semibold text-sam-brown">Aiutaci a capire chi usa SAM (facoltativo)</p>

            <label className="mt-2 flex items-start gap-2">
              <input
                type="checkbox"
                name="consent_analytics"
                checked={consentAnalytics}
                onChange={(e) => setConsentAnalytics(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-sam-green"
              />
              <span className="text-[11px] leading-snug text-sam-muted">
                {ANALYTICS_CONSENT_LABEL}{" "}
                <Link href="/privacy" className="font-semibold text-sam-green hover:underline">
                  Dettagli nell'informativa
                </Link>
                .
              </span>
            </label>

            {/* I campi compaiono SOLO dopo il consenso: nessuna raccolta altrimenti. */}
            {consentAnalytics && (
              <div className="mt-3">
                {/* Occupazione (chip a scelta singola) */}
                <span className="mb-1 block text-xs font-semibold text-sam-green">Cosa fai?</span>
                <div className="flex flex-wrap gap-2">
                  {OCCUPATIONS.map((o) => {
                    const active = occupation === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setOccupation(active ? "" : o.value)}
                        aria-pressed={active}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          active
                            ? "bg-sam-green text-sam-paper"
                            : "bg-sam-cream text-sam-brown hover:bg-sam-cream/70"
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
                {/* Valore inviato col form */}
                <input type="hidden" name="occupation" value={occupation} />

                {/* Università: solo se studente */}
                {occupation === "studente" && (
                  <label className="mt-3 block">
                    <span className="mb-1 block text-xs font-semibold text-sam-green">Università</span>
                    <select name="university" defaultValue="" className={inputClass}>
                      <option value="">Seleziona…</option>
                      {MILAN_UNIVERSITIES.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </label>
                )}

                {/* Fascia d'età */}
                <label className="mt-3 block">
                  <span className="mb-1 block text-xs font-semibold text-sam-green">Età</span>
                  <select name="age_range" defaultValue="" className={inputClass}>
                    <option value="">Preferisco non dirlo</option>
                    {AGE_RANGES.map((a) => (
                      <option key={a} value={a}>{a} anni</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>

          {/* --- Consenso obbligatorio all'informativa (art. 13) --- */}
          <label className="!mt-5 flex items-start gap-2 border-t border-sam-cream pt-4">
            <input
              type="checkbox"
              name="accept_privacy"
              required
              className="mt-0.5 h-4 w-4 shrink-0 accent-sam-green"
            />
            <span className="text-[11px] leading-snug text-sam-muted">
              Ho letto e accetto l'
              <Link href="/privacy" className="font-semibold text-sam-green hover:underline">
                Informativa privacy
              </Link>{" "}
              e ho almeno 16 anni.
            </span>
          </label>

          {state?.error && <p className="text-sm text-sam-coral">{state.error}</p>}
          {state?.message && <p className="text-sm text-sam-green">{state.message}</p>}

          <SubmitButton />
        </form>

        <p className="mt-6 text-center text-sm text-sam-muted">
          Hai già un account?{" "}
          <Link href="/login" className="font-semibold text-sam-green hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
