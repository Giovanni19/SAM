"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

// Mostra "Accedi" oppure l'avatar con menu (account / logout). Lato client,
// così le pagine di contenuto restano statiche.
export default function AuthNav() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

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

  // Chiudi il menu al click fuori o con Esc.
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  if (!ready) return <span className="h-9 w-9" aria-hidden />; // placeholder, niente flicker

  if (user) {
    const initials = getInitials(user.user_metadata?.full_name, user.email);
    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          title="Il tuo account"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-sam-green font-display text-sm font-bold text-sam-paper transition hover:bg-sam-green-dark"
        >
          {initials}
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-sam-cream bg-white py-1 shadow-card"
          >
            <Link
              href="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm font-semibold text-sam-brown transition hover:bg-sam-cream"
            >
              Il tuo account
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="block w-full px-4 py-2 text-left text-sm font-semibold text-sam-coral transition hover:bg-sam-cream"
            >
              Esci
            </button>
          </div>
        )}
      </div>
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
