"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";

// Banner globale "Accedi o registrati…": qualunque componente può mostrarlo
// chiamando useAuthPrompt().show("messaggio"). Compare in basso, con i link
// ad accesso e registrazione, e si chiude da solo dopo qualche secondo.
const AuthPromptContext = createContext({ show: () => {} });

export function useAuthPrompt() {
  return useContext(AuthPromptContext);
}

export default function AuthPromptProvider({ children }) {
  const [message, setMessage] = useState(null);

  const show = useCallback((msg) => setMessage(msg), []);
  const close = useCallback(() => setMessage(null), []);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 6000);
    return () => clearTimeout(id);
  }, [message]);

  return (
    <AuthPromptContext.Provider value={{ show }}>
      {children}

      {message && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[1200] flex justify-center px-4">
          <div
            role="alert"
            className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-sam-cream bg-white p-4 shadow-card"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/sam-icon.svg" alt="" aria-hidden className="h-12 w-12 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-sam-green">{message}</p>
              <div className="mt-2 flex gap-2">
                <Link
                  href="/login"
                  onClick={close}
                  className="rounded-full bg-sam-green px-3 py-1.5 text-xs font-semibold text-sam-paper transition hover:bg-sam-green-dark"
                >
                  Accedi
                </Link>
                <Link
                  href="/signup"
                  onClick={close}
                  className="rounded-full border border-sam-green/30 px-3 py-1.5 text-xs font-semibold text-sam-green transition hover:bg-sam-green/5"
                >
                  Registrati
                </Link>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Chiudi"
              className="shrink-0 self-start rounded-full px-2 text-sam-muted hover:bg-sam-cream"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </AuthPromptContext.Provider>
  );
}
