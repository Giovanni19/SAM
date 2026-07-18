"use client";

import Link from "next/link";
import { resetConsentChoice } from "@/components/CookieConsentBanner";

export default function CookiePage() {
  return (
    <div className="container-sam max-w-3xl py-12">
      <h1 className="font-display text-3xl font-bold text-sam-green">Cookie policy</h1>
      <p className="mt-2 text-sm text-sam-muted">
        Come SAM utilizza i cookie e le tecnologie simili.
      </p>

      <section className="mt-8 space-y-2 text-sm leading-relaxed text-sam-brown/90">
        <p>
          SAM utilizza <strong>cookie tecnici necessari</strong> al funzionamento del sito, per cui{" "}
          <strong>non è richiesto il consenso</strong> (art. 122 del Codice Privacy e Linee guida del
          Garante), e <strong>cookie di analisi</strong> (Google Analytics, tramite Google Tag Manager)
          che vengono attivati <strong>solo se dai il tuo consenso esplicito</strong> dal banner mostrato
          alla prima visita.
        </p>
        <p>
          Finché non accetti, questi cookie restano bloccati (Google Consent Mode). Puoi cambiare la tua
          scelta in qualsiasi momento:{" "}
          <button
            type="button"
            onClick={resetConsentChoice}
            className="font-semibold text-sam-green hover:underline"
          >
            gestisci il consenso cookie
          </button>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold text-sam-green">Cookie utilizzati</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-sam-cream text-left text-sam-green">
                <th className="py-2 pr-4 font-semibold">Cookie</th>
                <th className="py-2 pr-4 font-semibold">Fornitore</th>
                <th className="py-2 pr-4 font-semibold">Finalità</th>
                <th className="py-2 font-semibold">Tipo</th>
              </tr>
            </thead>
            <tbody className="text-sam-brown/90">
              <tr className="border-b border-sam-cream/60">
                <td className="py-2 pr-4">
                  <code>sb-*-auth-token</code>
                </td>
                <td className="py-2 pr-4">Supabase</td>
                <td className="py-2 pr-4">Mantenere l'utente autenticato tra le pagine.</td>
                <td className="py-2">Tecnico necessario</td>
              </tr>
              <tr className="border-b border-sam-cream/60">
                <td className="py-2 pr-4">
                  <code>_ga</code>, <code>_ga_*</code>, <code>_gid</code>
                </td>
                <td className="py-2 pr-4">Google Analytics (via Google Tag Manager)</td>
                <td className="py-2 pr-4">Statistiche aggregate su come viene usato il sito.</td>
                <td className="py-2">Analisi — solo con consenso</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 space-y-2 text-sm leading-relaxed text-sam-brown/90">
        <h2 className="font-display text-xl font-bold text-sam-green">Local storage</h2>
        <p>
          Se non hai un account, i tuoi <strong>preferiti</strong> vengono salvati nel{" "}
          <em>local storage</em> del browser (chiave <code>sam:favorites</code>), sul tuo dispositivo.
          Non vengono trasmessi ai nostri server finché non accedi.
        </p>
      </section>

      <p className="mt-10 text-sm">
        <Link href="/privacy" className="font-semibold text-sam-green hover:underline">
          → Torna all'Informativa privacy
        </Link>
      </p>
    </div>
  );
}
