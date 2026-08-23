"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { deleteAccount } from "@/app/auth/actions";
import { ANALYTICS_CONSENT_LABEL } from "@/lib/profile";
import { useI18n } from "@/components/I18nProvider";
import { getDictionary } from "@/lib/i18n";

// Sezione "Privacy e dati" della pagina account: gestione del consenso alle
// analytics, esportazione dei dati (portabilità) e cancellazione dell'account
// (diritto all'oblio). Raccoglie in un unico posto i diritti dell'interessato.
export default function AccountPrivacy({ userId, consentAnalytics }) {
  const { t, lang, href } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [confirming, setConfirming] = useState(false);
  // La server action risponde in italiano: qui teniamo solo il fatto che sia
  // fallita e mostriamo il messaggio nella lingua della pagina.
  const [deleteFailed, setDeleteFailed] = useState(false);

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
      setMsg(t.privacySection.consentOn);
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
      setMsg(t.privacySection.consentOff);
    }

    setBusy(false);
    router.refresh();
  }

  async function handleDelete() {
    setBusy(true);
    setDeleteFailed(false);
    const res = await deleteAccount();
    // Se torna un oggetto, c'è stato un errore (il caso di successo fa redirect).
    if (res?.errorCode) {
      setDeleteFailed(true);
      setBusy(false);
    }
  }

  return (
    <div className="mt-10 max-w-md border-t border-sam-cream pt-8">
      <h2 className="font-display text-xl font-bold text-sam-green">{t.privacySection.title}</h2>
      <p className="mt-1 text-sm text-sam-muted">
        {t.privacySection.subtitlePre}{" "}
        <Link href={href("/privacy")} className="font-semibold text-sam-green hover:underline">
          {t.privacySection.subtitleLink}
        </Link>
        .
      </p>

      {/* --- Consenso analytics --- */}
      <div className="mt-5 rounded-2xl border border-sam-cream bg-white p-5 shadow-card">
        {/* Il testo del consenso è la formula giuridica su cui si basa il
            trattamento: resta in italiano finché non c'è una versione EN
            validata legalmente (stessa scelta di privacy/cookie). Agli utenti
            in inglese mostriamo una nota, non una traduzione non validata. */}
        {lang === "en" && (
          <p className="mb-2 text-[11px] italic text-sam-muted">
            {getDictionary("en").legal.consentItalianNotice}
          </p>
        )}
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
        {t.privacySection.export}
      </a>

      {/* --- Cancellazione account (diritto all'oblio) --- */}
      <div className="mt-6 rounded-2xl border border-sam-coral/40 bg-sam-coral/5 p-5">
        <h3 className="text-sm font-semibold text-sam-coral">{t.privacySection.deleteTitle}</h3>
        <p className="mt-1 text-[12px] text-sam-brown/80">{t.privacySection.deleteWarning}</p>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-3 rounded-xl border border-sam-coral px-4 py-2 text-sm font-semibold text-sam-coral transition hover:bg-sam-coral hover:text-white"
          >
            {t.privacySection.deleteCta}
          </button>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="text-[12px] font-semibold text-sam-coral">{t.privacySection.deleteConfirm}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="rounded-xl bg-sam-coral px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? t.privacySection.deleting : t.privacySection.deleteYes}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="rounded-xl border border-sam-cream px-4 py-2 text-sm font-semibold text-sam-brown"
              >
                {t.privacySection.cancel}
              </button>
            </div>
            {deleteFailed && <p className="text-xs text-sam-coral">{t.privacySection.deleteError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
