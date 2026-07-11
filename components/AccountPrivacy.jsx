"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { deleteAccount } from "@/app/auth/actions";
import { ANALYTICS_CONSENT_LABEL } from "@/lib/profile";

// Sezione "Privacy e dati" della pagina account: gestione del consenso alle
// analytics, esportazione dei dati (portabilità) e cancellazione dell'account
// (diritto all'oblio). Raccoglie in un unico posto i diritti dell'interessato.
export default function AccountPrivacy({ userId, consentAnalytics }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  async function toggleConsent(next) {
    setBusy(true);
    setMsg(null);
    const supabase = createClient();

    if (next) {
      await supabase
        .from("profiles")
        .update({ consent_analytics: true, consent_analytics_at: new Date().toISOString() })
        .eq("id", userId);
      await supabase.auth.updateUser({ data: { consent_analytics: true } });
      setMsg("Consenso attivato. Ora puoi compilare i dati di profilazione.");
    } else {
      // Revoca: oltre a togliere il consenso, cancelliamo i dati di profilazione
      // già raccolti, così il trattamento cessa davvero.
      await supabase
        .from("profiles")
        .update({
          consent_analytics: false,
          consent_analytics_at: null,
          occupation: null,
          university: null,
          age_range: null,
        })
        .eq("id", userId);
      await supabase.auth.updateUser({
        data: { consent_analytics: false, occupation: "", university: "", age_range: "" },
      });
      setMsg("Consenso revocato e dati di profilazione eliminati.");
    }

    setBusy(false);
    router.refresh();
  }

  async function handleDelete() {
    setBusy(true);
    setDeleteError(null);
    const res = await deleteAccount();
    // Se torna un oggetto, c'è stato un errore (il caso di successo fa redirect).
    if (res?.error) {
      setDeleteError(res.error);
      setBusy(false);
    }
  }

  return (
    <div className="mt-10 max-w-md border-t border-sam-cream pt-8">
      <h2 className="font-display text-xl font-bold text-sam-green">Privacy e dati</h2>
      <p className="mt-1 text-sm text-sam-muted">
        Gestisci il consenso ed esercita i tuoi diritti. Dettagli nell'{" "}
        <Link href="/privacy" className="font-semibold text-sam-green hover:underline">
          Informativa privacy
        </Link>
        .
      </p>

      {/* --- Consenso analytics --- */}
      <div className="mt-5 rounded-2xl border border-sam-cream bg-white p-5 shadow-card">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={consentAnalytics}
            disabled={busy}
            onChange={(e) => toggleConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-sam-green"
          />
          <span className="text-[12px] leading-snug text-sam-brown/90">{ANALYTICS_CONSENT_LABEL}</span>
        </label>
        {msg && <p className="mt-2 text-xs text-sam-green">{msg}</p>}
      </div>

      {/* --- Esportazione dati (portabilità) --- */}
      <a href="/account/export" className="btn-outline mt-3 flex w-full items-center justify-center">
        ⬇ Esporta i miei dati (JSON)
      </a>

      {/* --- Cancellazione account (diritto all'oblio) --- */}
      <div className="mt-6 rounded-2xl border border-sam-coral/40 bg-sam-coral/5 p-5">
        <h3 className="text-sm font-semibold text-sam-coral">Elimina il tuo account</h3>
        <p className="mt-1 text-[12px] text-sam-brown/80">
          Operazione irreversibile: verranno eliminati definitivamente account, profilo e preferiti.
        </p>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-3 rounded-xl border border-sam-coral px-4 py-2 text-sm font-semibold text-sam-coral transition hover:bg-sam-coral hover:text-white"
          >
            Elimina account
          </button>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="text-[12px] font-semibold text-sam-coral">Sei sicuro? L'azione non è annullabile.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="rounded-xl bg-sam-coral px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Eliminazione…" : "Sì, elimina definitivamente"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="rounded-xl border border-sam-cream px-4 py-2 text-sm font-semibold text-sam-brown"
              >
                Annulla
              </button>
            </div>
            {deleteError && <p className="text-xs text-sam-coral">{deleteError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
