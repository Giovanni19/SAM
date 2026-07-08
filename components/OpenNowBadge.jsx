"use client";

import { useEffect, useState } from "react";
import { openStatus } from "@/lib/utils";

/**
 * Badge "Aperto ora / Chiuso" calcolato in tempo reale dagli orari.
 * size: "sm" | "md". Non renderizza nulla se gli orari sono sconosciuti
 * (a meno di showUnknown).
 */
export default function OpenNowBadge({ hours, size = "md", showUnknown = false }) {
  // now nello state per aggiornare il badge col passare del tempo.
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null; // evita mismatch di idratazione (SSR non conosce l'ora)

  const st = openStatus(hours, now);
  if (st.state === "unknown" && !showUnknown) return null;

  const styles = {
    open: "bg-sam-green/10 text-sam-green",
    closed: "bg-sam-coral/10 text-sam-coral",
    unknown: "bg-sam-cream text-sam-muted",
  }[st.state];

  const dot = { open: "bg-sam-green", closed: "bg-sam-coral", unknown: "bg-sam-muted" }[st.state];

  const label =
    st.state === "open"
      ? st.closesAt
        ? `Aperto · chiude alle ${st.closesAt}`
        : "Aperto ora"
      : st.state === "closed"
      ? "Chiuso ora"
      : "Orari non disponibili";

  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${pad} ${styles}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
