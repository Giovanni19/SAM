"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Su mobile usa la scheda di condivisione nativa (Web Share API); altrove
// copia il link negli appunti e mostra una conferma temporanea.
export default function ShareButton({ url, title, text, className, size = "md" }) {
  const [status, setStatus] = useState(null); // null | "copied" | "error"

  const sizes = {
    sm: "h-8 w-8 text-base",
    md: "h-10 w-10 text-lg",
  };

  async function handleShare(e) {
    e.preventDefault();
    e.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // L'utente ha annullato la condivisione: nessuna azione necessaria.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      // Permessi negati o clipboard non disponibile: mostriamo comunque il
      // link, così l'utente può copiarlo a mano invece di restare senza feedback.
      setStatus("error");
    }
    setTimeout(() => setStatus(null), 3000);
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="Condividi"
        onClick={handleShare}
        className={cn(
          "flex items-center justify-center rounded-full bg-sam-paper/90 shadow-card backdrop-blur transition hover:scale-110 active:scale-95",
          sizes[size],
          className
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[45%] w-[45%] text-sam-muted"
        >
          {/* Icona "condividi" in stile iOS (square.and.arrow.up): freccia in alto + tray aperto sotto. */}
          <path d="M8 7l4-4 4 4" />
          <path d="M12 3v12" />
          <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
        </svg>
      </button>
      {status === "copied" && (
        <span className="absolute -bottom-8 right-0 whitespace-nowrap rounded-full bg-sam-green px-3 py-1 text-xs font-semibold text-sam-paper shadow-card">
          Link copiato!
        </span>
      )}
      {status === "error" && (
        <span className="absolute -bottom-8 right-0 max-w-[14rem] whitespace-normal break-all rounded-xl bg-sam-brown px-3 py-1.5 text-xs font-medium text-sam-paper shadow-card">
          Copia il link a mano: {url}
        </span>
      )}
    </span>
  );
}
