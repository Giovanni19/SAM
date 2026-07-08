"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";

// Modal globale "Accedi o registrati…": qualunque componente può mostrarlo
// chiamando useAuthPrompt().show("messaggio"). Compare al centro, sopra un
// overlay scuro che oscura il resto della pagina; l'utente può chiuderlo con
// la X, ma finché non accede filtri e preferiti restano bloccati.
const AuthPromptContext = createContext({ show: () => {} });

export function useAuthPrompt() {
  return useContext(AuthPromptContext);
}

export default function AuthPromptProvider({ children }) {
  const [message, setMessage] = useState(null);

  const show = useCallback((msg) => setMessage(msg), []);
  const close = useCallback(() => setMessage(null), []);

  // Chiudi con Esc, come ci si aspetta da un modal.
  useEffect(() => {
    if (!message) return;
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [message, close]);

  return (
    <AuthPromptContext.Provider value={{ show }}>
      {children}

      {message && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
          {/* Overlay: oscura il resto della pagina, chiude al click fuori */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={close}
            aria-hidden
          />

          <div
            role="alertdialog"
            aria-modal="true"
            className="relative flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl border border-sam-cream bg-white p-8 text-center shadow-card-hover"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Chiudi"
              className="absolute right-3 top-3 rounded-full px-2 py-1 text-sam-muted hover:bg-sam-cream"
            >
              ✕
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/sam-icon.svg" alt="" aria-hidden className="h-16 w-16" />

            <p className="text-lg font-semibold text-sam-green">{message}</p>

            <div className="mt-1 flex gap-3">
              <Link
                href="/login"
                onClick={close}
                className="btn-primary"
              >
                Accedi
              </Link>
              <Link
                href="/signup"
                onClick={close}
                className="btn-outline"
              >
                Registrati
              </Link>
            </div>
          </div>
        </div>
      )}
    </AuthPromptContext.Provider>
  );
}
