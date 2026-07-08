"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-xl border border-sam-cream bg-sam-paper px-4 py-2.5 text-sm outline-none focus:border-sam-green";

export default function ResetPasswordPage() {
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
      setError("La password deve avere almeno 6 caratteri.");
      return;
    }
    if (password !== confirm) {
      setError("Le due password non coincidono.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) {
      setError("Il link potrebbe essere scaduto. Richiedine uno nuovo.");
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
          <h1 className="font-display text-3xl font-bold text-sam-green">Password aggiornata</h1>
          <p className="mt-2 text-sm text-sam-muted">
            La tua password è stata cambiata con successo.
          </p>
          <Link href="/account" className="btn-primary mt-6 inline-flex">
            Vai al tuo account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-sam flex justify-center py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-bold text-sam-green">Scegli una nuova password</h1>
        <p className="mt-1 text-sm text-sam-muted">Inserisci la password che vuoi usare d'ora in poi.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-2xl bg-white p-5 shadow-card">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-sam-green">Nuova password</span>
            <input name="password" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
            <span className="mt-1 block text-[11px] text-sam-muted">Almeno 6 caratteri.</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-sam-green">Conferma password</span>
            <input name="confirm" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
          </label>
          {error && <p className="text-sm text-sam-coral">{error}</p>}
          <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
            {pending ? "Attendere…" : "Salva nuova password"}
          </button>
        </form>
      </div>
    </div>
  );
}
