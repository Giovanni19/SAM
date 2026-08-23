"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import Link from "next/link";
import { magicLink } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/I18nProvider";
import { authMessage } from "@/lib/i18n";

const inputClass =
  "w-full rounded-xl border border-sam-cream bg-sam-paper px-4 py-2.5 text-sm outline-none focus:border-sam-green";

// Traduce i messaggi Supabase più comuni nella lingua corrente.
function translateError(msg = "", t) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return t.auth.errInvalid;
  if (m.includes("email not confirmed")) return t.auth.errUnconfirmed;
  if (m.includes("rate limit") || m.includes("too many")) return t.auth.errRateLimit;
  return msg || t.auth.errGeneric;
}

function SubmitButton({ children, variant = "primary" }) {
  const { t } = useI18n();
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${variant === "primary" ? "btn-primary" : "btn-outline"} w-full disabled:opacity-60`}
    >
      {pending ? t.auth.waiting : children}
    </button>
  );
}

function Feedback({ state }) {
  const { t } = useI18n();
  if (state?.errorCode)
    return <p className="text-sm text-sam-coral">{authMessage(state.errorCode, t)}</p>;
  if (state?.messageCode)
    return <p className="text-sm text-sam-green">{authMessage(state.messageCode, t)}</p>;
  return null;
}

export default function LoginPage() {
  const { t, href } = useI18n();
  const [magicState, magicAction] = useFormState(magicLink, {});
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  // Login lato CLIENT: la sessione finisce subito nei cookie del browser e
  // onAuthStateChange aggiorna l'avatar all'istante, senza dover ricaricare.
  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    if (!email || !password) {
      setError(t.auth.missingCredentials);
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(translateError(authError.message, t));
      setPending(false);
      return;
    }
    window.location.assign(href("/account"));
  }

  return (
    <div className="container-sam flex justify-center py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-bold text-sam-green">{t.auth.loginTitle}</h1>
        <p className="mt-1 text-sm text-sam-muted">{t.auth.loginSubtitle}</p>

        {/* Email + password */}
        <form onSubmit={handleLogin} className="mt-6 space-y-3 rounded-2xl bg-white p-5 shadow-card">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-sam-green">{t.auth.email}</span>
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-sam-green">{t.auth.password}</span>
            <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
          </label>
          {error && <p className="text-sm text-sam-coral">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="btn-primary w-full disabled:opacity-60"
          >
            {pending ? t.auth.waiting : t.auth.loginTitle}
          </button>
          <div className="text-right">
            <Link href={href("/forgot-password")} className="text-xs font-semibold text-sam-green hover:underline">
              {t.auth.forgot}
            </Link>
          </div>
        </form>

        {/* Divisore */}
        <div className="my-5 flex items-center gap-3 text-xs text-sam-muted">
          <span className="h-px flex-1 bg-sam-cream" /> {t.auth.or} <span className="h-px flex-1 bg-sam-cream" />
        </div>

        {/* Magic link */}
        <form action={magicAction} className="space-y-3 rounded-2xl bg-white p-5 shadow-card">
          <p className="text-sm font-semibold text-sam-green">{t.auth.magicTitle}</p>
          <p className="text-xs text-sam-muted">{t.auth.magicHint}</p>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-sam-green">{t.auth.email}</span>
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </label>
          <Feedback state={magicState} />
          <SubmitButton variant="outline">{t.auth.magicSend}</SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-sam-muted">
          {t.auth.noAccount}{" "}
          <Link href={href("/signup")} className="font-semibold text-sam-green hover:underline">
            {t.nav.signup}
          </Link>
        </p>
      </div>
    </div>
  );
}
