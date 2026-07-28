"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/I18nProvider";

const inputClass =
  "w-full rounded-xl border border-sam-cream bg-sam-paper px-4 py-2.5 text-sm outline-none focus:border-sam-green";

export default function ResetPasswordPage() {
  const { t, href } = useI18n();
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  // A questo punto l'utente arriva già con una sessione temporanea aperta dal
  // link ricevuto via email (gestita da /auth/confirm), quindi può aggiornare
  // direttamente la password del proprio account.
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    if (password.length < 6) {
      setError(t.auth.resetTooShort);
      return;
    }
    if (password !== confirm) {
      setError(t.auth.resetMismatch);
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) {
      setError(t.auth.resetExpired);
      setPending(false);
      return;
    }
    setDone(true);
    setPending(false);
  }

  if (done) {
    return (
      <div className="container-sam flex justify-center py-12">
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-3xl font-bold text-sam-green">{t.auth.resetDoneTitle}</h1>
          <p className="mt-2 text-sm text-sam-muted">{t.auth.resetDoneText}</p>
          <Link href={href("/account")} className="btn-primary mt-6 inline-flex">
            {t.auth.resetGoAccount}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-sam flex justify-center py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-bold text-sam-green">{t.auth.resetTitle}</h1>
        <p className="mt-1 text-sm text-sam-muted">{t.auth.resetSubtitle}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-2xl bg-white p-5 shadow-card">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-sam-green">{t.auth.newPassword}</span>
            <input name="password" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
            <span className="mt-1 block text-[11px] text-sam-muted">{t.auth.minChars}</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-sam-green">{t.auth.confirmPassword}</span>
            <input name="confirm" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
          </label>
          {error && <p className="text-sm text-sam-coral">{error}</p>}
          <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
            {pending ? t.auth.waiting : t.auth.resetSave}
          </button>
        </form>
      </div>
    </div>
  );
}
