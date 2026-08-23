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
  UNIVERSITY_OTHER,
} from "@/lib/profile";
import { useI18n } from "@/components/I18nProvider";
import { getDictionary, authMessage } from "@/lib/i18n";

const inputClass =
  "w-full rounded-xl border border-sam-cream bg-sam-paper px-4 py-2.5 text-sm outline-none focus:border-sam-green";

function SubmitButton() {
  const { t } = useI18n();
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
      {pending ? t.auth.waiting : t.auth.createAccount}
    </button>
  );
}

export default function SignupPage() {
  const { t, href, lang } = useI18n();
  const [state, action] = useFormState(signup, {});
  const [occupation, setOccupation] = useState("");
  // I dati di profilazione si raccolgono SOLO con consenso esplicito e separato.
  const [consentAnalytics, setConsentAnalytics] = useState(false);

  return (
    <div className="container-sam flex justify-center py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-bold text-sam-green">{t.auth.signupTitle}</h1>
        <p className="mt-1 text-sm text-sam-muted">{t.auth.signupSubtitle}</p>

        <form action={action} className="mt-6 space-y-3 rounded-2xl bg-white p-5 shadow-card">
          {/* --- Parte obbligatoria --- */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-sam-green">{t.auth.firstName}</span>
              <input name="first_name" type="text" autoComplete="given-name" className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-sam-green">{t.auth.lastName}</span>
              <input name="last_name" type="text" autoComplete="family-name" className={inputClass} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-sam-green">{t.auth.email}</span>
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-sam-green">{t.auth.password}</span>
            <input name="password" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
            <span className="mt-1 block text-[11px] text-sam-muted">{t.auth.minChars}</span>
          </label>

          {/* --- Profilazione facoltativa, con consenso separato (GDPR) --- */}
          <div className="!mt-5 border-t border-sam-cream pt-4">
            <p className="text-xs font-semibold text-sam-brown">{t.auth.profilingTitle}</p>

            {/* La formula di consenso resta in italiano finché non c'è una
                versione EN validata legalmente: agli utenti in inglese diamo
                una nota, come nelle pagine privacy/cookie. */}
            {lang === "en" && (
              <p className="mt-2 text-[11px] italic text-sam-muted">
                {getDictionary("en").legal.consentItalianNotice}
              </p>
            )}

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
                <Link href={href("/privacy")} className="font-semibold text-sam-green hover:underline">
                  {t.auth.privacyDetails}
                </Link>
                .
              </span>
            </label>

            {/* I campi compaiono SOLO dopo il consenso: nessuna raccolta altrimenti. */}
            {consentAnalytics && (
              <div className="mt-3">
                {/* Occupazione (chip a scelta singola) */}
                <span className="mb-1 block text-xs font-semibold text-sam-green">{t.auth.occupation}</span>
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
                        {t.occupations[o.value] || o.label}
                      </button>
                    );
                  })}
                </div>
                {/* Valore inviato col form */}
                <input type="hidden" name="occupation" value={occupation} />

                {/* Università: solo se studente */}
                {occupation === "studente" && (
                  <label className="mt-3 block">
                    <span className="mb-1 block text-xs font-semibold text-sam-green">{t.auth.university}</span>
                    <select name="university" defaultValue="" className={inputClass}>
                      <option value="">{t.auth.selectPlaceholder}</option>
                      {MILAN_UNIVERSITIES.map((u) => (
                        // Il valore salvato resta canonico; solo "Altro" è tradotto.
                        <option key={u} value={u}>{u === UNIVERSITY_OTHER ? t.universityOther : u}</option>
                      ))}
                    </select>
                  </label>
                )}

                {/* Fascia d'età */}
                <label className="mt-3 block">
                  <span className="mb-1 block text-xs font-semibold text-sam-green">{t.auth.age}</span>
                  <select name="age_range" defaultValue="" className={inputClass}>
                    <option value="">{t.auth.agePreferNot}</option>
                    {AGE_RANGES.map((a) => (
                      <option key={a} value={a}>{a} {t.auth.ageSuffix}</option>
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
              {t.auth.acceptPrivacyPre}
              <Link href={href("/privacy")} className="font-semibold text-sam-green hover:underline">
                {t.auth.acceptPrivacyLink}
              </Link>{" "}
              {t.auth.acceptPrivacyPost}
            </span>
          </label>

          {state?.errorCode && (
            <p className="text-sm text-sam-coral">{authMessage(state.errorCode, t)}</p>
          )}
          {state?.messageCode && (
            <p className="text-sm text-sam-green">{authMessage(state.messageCode, t)}</p>
          )}

          <SubmitButton />
        </form>

        <p className="mt-6 text-center text-sm text-sam-muted">
          {t.auth.haveAccount}{" "}
          <Link href={href("/login")} className="font-semibold text-sam-green hover:underline">
            {t.nav.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
