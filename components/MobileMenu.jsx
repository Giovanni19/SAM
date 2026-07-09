"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Menu a comparsa per schermi piccoli: raccoglie navigazione + auth dietro un
// pulsante hamburger, così l'header non si affolla sul telefono.
export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
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

  const linkClass =
    "block rounded-lg px-3 py-2.5 text-sm font-semibold text-sam-brown transition hover:bg-sam-cream";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full text-sam-green transition hover:bg-sam-cream"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-sam-cream bg-white p-1 shadow-card">
          <Link href="/spaces" onClick={() => setOpen(false)} className={linkClass}>
            Spazi
          </Link>
          <Link href="/map" onClick={() => setOpen(false)} className={linkClass}>
            Mappa
          </Link>
          <Link href="/favorites" onClick={() => setOpen(false)} className={linkClass}>
            ♥ Preferiti
          </Link>

          <div className="my-1 border-t border-sam-cream" />

          {user ? (
            <>
              <Link href="/account" onClick={() => setOpen(false)} className={linkClass}>
                Il tuo account
              </Link>
              <button type="button" onClick={handleLogout} className={`${linkClass} w-full text-left text-sam-coral`}>
                Esci
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)} className={linkClass}>
              Accedi
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
