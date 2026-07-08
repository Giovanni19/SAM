"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Iniziali dell'utente: nome + cognome (es. "Mario Rossi" → "MR").
// Con un solo nome usa una sola iniziale; senza nome ripiega sull'email.
function getInitials(fullName, email) {
  const name = (fullName || "").trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
  }
  return ((email || "?").trim()[0] || "?").toUpperCase();
}

// Mostra "Accedi" oppure l'avatar dell'account. Lato client, così le pagine
// di contenuto restano statiche.
export default function AuthNav() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <span className="h-9 w-9" aria-hidden />; // placeholder, niente flicker

  if (user) {
    const initials = getInitials(user.user_metadata?.full_name, user.email);
    return (
      <Link
        href="/account"
        title="Il tuo account"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-sam-green font-display text-sm font-bold text-sam-paper transition hover:bg-sam-green-dark"
      >
        {initials}
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-full px-3 py-2 text-sm font-semibold text-sam-brown transition hover:bg-sam-cream"
    >
      Accedi
    </Link>
  );
}
