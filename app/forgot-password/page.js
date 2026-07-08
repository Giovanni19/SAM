"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-xl border border-sam-cream bg-sam-paper px-4 py-2.5 text-sm outline-none focus:border-sam-green";

export default function ForgotPasswordPage() {
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [pending, setPending] = useState(false);

  // Invia l'email con il link per reimpostare la password. Il link porta a
  // /auth/confirm, che apre una sessione temporanea e poi manda l'utente su
  // /reset-password, dove può scegliere la nuova password.
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const email = String(new FormData(e.currentTarget).get("email") || "").trim();
    if (!email) {
      setError("Inserisci la tua email.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    });
    if (authError) {
      setError("Si è verificato un errore. Riprova.");
      setPending(false);
      return;
    }
    setMessage("Se esiste un account con questa email, ti abbiamo inviato un link per reimpostare la password.");
    setPending(false);
  }

  return (
    <div className="container-sam flex justify-center py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-bold text-sam-green">Password dimenticata</h1>
        <p className="mt-1 text-sm text-sam-muted">
          Inserisci la tua email: ti invieremo un link per crearne una nuova.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-2xl bg-white p-5 shadow-card">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-sam-green">Email</span>
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </label>
          {error && <p className="text-sm text-sam-coral">{error}</p>}
          {message && <p className="text-sm text-sam-green">{message}</p>}
          <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
            {pending ? "Attendere…" : "Inviami il link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-sam-muted">
          Ti sei ricordato la password?{" "}
          <Link href="/login" className="font-semibold text-sam-green hover:underline">
            Torna all'accesso
          </Link>
        </p>
      </div>
    </div>
  );
}
