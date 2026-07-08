"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import Link from "next/link";
import { magicLink } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-xl border border-sam-cream bg-sam-paper px-4 py-2.5 text-sm outline-none focus:border-sam-green";

// Messaggi Supabase più comuni in italiano (lato client).
function traduciErrore(msg = "") {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email o password non corretti.";
  if (m.includes("email not confirmed")) return "Devi confermare l'email prima di accedere.";
  if (m.includes("rate limit") || m.includes("too many")) return "Troppi tentativi, riprova tra poco.";
  return msg || "Si è verificato un errore. Riprova.";
}

function SubmitButton({ children, variant = "primary" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${variant === "primary" ? "btn-primary" : "btn-outline"} w-full disabled:opacity-60`}
    >
      {pending ? "Attendere…" : children}
    </button>
  );
}

function Feedback({ state }) {
  if (state?.error) return <p className="text-sm text-sam-coral">{state.error}</p>;
  if (state?.message) return <p className="text-sm text-sam-green">{state.message}</p>;
  return null;
}

export default function LoginPage() {
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
      setError("Inserisci email e password.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(traduciErrore(authError.message));
      setPending(false);
      return;
    }
    window.location.assign("/account");
  }

  return (
    <div className="container-sam flex justify-center py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-bold text-sam-green">Accedi</h1>
        <p className="mt-1 text-sm text-sam-muted">
          Bentornato su SAM. Accedi per ritrovare i tuoi preferiti ovunque.
        </p>

        {/* Email + password */}
        <form onSubmit={handleLogin} className="mt-6 space-y-3 rounded-2xl bg-white p-5 shadow-card">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-sam-green">Email</span>
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-sam-green">Password</span>
            <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
          </label>
          {error && <p className="text-sm text-sam-coral">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="btn-primary w-full disabled:opacity-60"
          >
            {pending ? "Attendere…" : "Accedi"}
          </button>
          <div className="text-right">
            <Link href="/forgot-password" className="text-xs font-semibold text-sam-green hover:underline">
              Ho dimenticato la mia password
            </Link>
          </div>
        </form>

        {/* Divisore */}
        <div className="my-5 flex items-center gap-3 text-xs text-sam-muted">
          <span className="h-px flex-1 bg-sam-cream" /> oppure <span className="h-px flex-1 bg-sam-cream" />
        </div>

        {/* Magic link */}
        <form action={magicAction} className="space-y-3 rounded-2xl bg-white p-5 shadow-card">
          <p className="text-sm font-semibold text-sam-green">Accedi senza password</p>
          <p className="text-xs text-sam-muted">Ti inviamo un link magico via email: clicchi e sei dentro.</p>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-sam-green">Email</span>
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </label>
          <Feedback state={magicState} />
          <SubmitButton variant="outline">✉️ Inviami il link</SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-sam-muted">
          Non hai un account?{" "}
          <Link href="/signup" className="font-semibold text-sam-green hover:underline">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}
