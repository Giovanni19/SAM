"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { signup } from "@/app/auth/actions";

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

  return (
    <div className="container-sam flex justify-center py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-bold text-sam-green">Crea il tuo account</h1>
        <p className="mt-1 text-sm text-sam-muted">
          Salva i tuoi posti preferiti e ritrovali su ogni dispositivo.
        </p>

        <form action={action} className="mt-6 space-y-3 rounded-2xl bg-white p-5 shadow-card">
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
