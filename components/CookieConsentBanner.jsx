"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { setConsent, applyStoredConsent } from "@/lib/consent";

// Banner di consenso cookie (Google Consent Mode v2). GTM parte sempre con
// tutti i segnali su 'denied': i tag di analytics/marketing restano bloccati
// finché l'utente non sceglie qui. Bottoni "Rifiuta"/"Accetta" a pari peso
// visivo, come richiesto dalle linee guida del Garante Privacy.
export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = applyStoredConsent();
    if (!stored) setVisible(true);
  }, []);

  function choose(status) {
    setConsent(status);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-sam-cream bg-white/95 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="container-sam flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-[12px] leading-snug text-sam-brown/90 sm:max-w-xl">
          Usiamo cookie tecnici necessari e, solo con il tuo consenso, cookie di analisi per capire come
          viene usato il sito.{" "}
          <Link href="/cookie" className="font-semibold text-sam-green hover:underline">
            Scopri di più
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="rounded-xl border border-sam-cream px-4 py-2 text-sm font-semibold text-sam-brown"
          >
            Rifiuta
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="rounded-xl bg-sam-green px-4 py-2 text-sm font-semibold text-white"
          >
            Accetta
          </button>
        </div>
      </div>
    </div>
  );
}

// Permette di riaprire il banner (es. link "Gestisci consenso" nella cookie
// policy) per cambiare scelta senza dover cancellare i dati del browser.
export function resetConsentChoice() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("sam:cookie-consent");
  window.location.reload();
}
