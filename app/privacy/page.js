import Link from "next/link";
import { PRIVACY_VERSION } from "@/lib/profile";

export const metadata = {
  title: "Informativa privacy — SAM",
  description:
    "Come SAM — Study Areas Milan tratta i tuoi dati personali ai sensi del Regolamento (UE) 2016/679 (GDPR).",
};

// NOTA: questo testo è una bozza tecnica completa ma NON sostituisce una
// revisione legale. Prima della pubblicazione, un consulente dovrebbe validare
// i riferimenti al Titolare, ai responsabili esterni e ai trasferimenti dati.

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-bold text-sam-green">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-sam-brown/90">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="container-sam max-w-3xl py-12">
      <h1 className="font-display text-3xl font-bold text-sam-green">Informativa sulla privacy</h1>
      <p className="mt-2 text-sm text-sam-muted">
        Versione {PRIVACY_VERSION} · ai sensi degli artt. 13-14 del Regolamento (UE) 2016/679 (“GDPR”).
      </p>

      <Section title="1. Titolare del trattamento">
        <p>
          Il Titolare del trattamento è <strong>SAM — Study Areas Milan</strong>, Milano (Italia).
          Per qualsiasi richiesta relativa ai tuoi dati puoi scrivere a{" "}
          <a href="mailto:info@studyareasmilan.it" className="font-semibold text-sam-green hover:underline">
            info@studyareasmilan.it
          </a>
          .
        </p>
        <p className="text-xs text-sam-muted">
          (Ragione sociale, indirizzo completo e — se nominato — il Responsabile della protezione dei
          dati vanno inseriti prima della pubblicazione.)
        </p>
      </Section>

      <Section title="2. Quali dati trattiamo">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Dati dell'account:</strong> email, nome e cognome (se forniti), password (conservata
            in forma cifrata dal nostro fornitore di autenticazione).
          </li>
          <li>
            <strong>Dati di profilazione (facoltativi):</strong> occupazione, università e fascia d'età,
            raccolti <em>solo</em> se presti l'apposito consenso separato.
          </li>
          <li>
            <strong>Preferiti:</strong> l'elenco degli spazi che salvi, collegato al tuo account.
          </li>
          <li>
            <strong>Dati tecnici:</strong> cookie tecnici necessari a mantenere la sessione di accesso
            (vedi la <Link href="/cookie" className="font-semibold text-sam-green hover:underline">Cookie policy</Link>).
          </li>
        </ul>
      </Section>

      <Section title="3. Finalità e basi giuridiche">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Erogare il servizio</strong> (registrazione, accesso, salvataggio dei preferiti) —
            base giuridica: esecuzione di un contratto (art. 6.1.b).
          </li>
          <li>
            <strong>Analisi statistica aggregata</strong> su occupazione, università e fascia d'età,
            incluse le <strong>analytics fornite a partner e clienti business</strong> di SAM in forma
            aggregata — base giuridica: <strong>consenso</strong> (art. 6.1.a), facoltativo e revocabile.
          </li>
          <li>
            <strong>Sicurezza e adempimenti di legge</strong> — base giuridica: legittimo interesse e
            obblighi legali (art. 6.1.c/f).
          </li>
        </ul>
      </Section>

      <Section title="4. Con chi condividiamo i dati (responsabili esterni)">
        <p>
          Ci avvaliamo di fornitori che trattano i dati per nostro conto, in qualità di responsabili del
          trattamento (art. 28):
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Supabase</strong> — autenticazione e database (hosting dei dati account, profilo e preferiti).
          </li>
          <li>
            <strong>Fornitore di hosting</strong> dell'applicazione web.
          </li>
        </ul>
        <p>
          I dati di profilazione condivisi con partner e clienti business sono <strong>esclusivamente
          aggregati e anonimi</strong>: non consentono di identificare il singolo utente.
        </p>
      </Section>

      <Section title="5. Trasferimenti extra-UE">
        <p>
          Ove un fornitore tratti dati al di fuori dello Spazio Economico Europeo, il trasferimento avviene
          sulla base di garanzie adeguate (es. Clausole Contrattuali Standard). Ci impegniamo a mantenere i
          dati ospitati in region europee ove disponibile.
        </p>
      </Section>

      <Section title="6. Per quanto tempo conserviamo i dati">
        <p>
          Conserviamo i dati dell'account finché l'account resta attivo. Se elimini l'account, i dati
          personali collegati (profilo e preferiti) vengono cancellati in modo definitivo. Alcuni dati
          possono essere conservati più a lungo se richiesto da obblighi di legge.
        </p>
      </Section>

      <Section title="7. I tuoi diritti">
        <p>Puoi in ogni momento esercitare i diritti previsti dagli artt. 15-22 del GDPR:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Accesso e rettifica:</strong> dalla pagina <Link href="/account" className="font-semibold text-sam-green hover:underline">Account</Link>.</li>
          <li><strong>Cancellazione</strong> (“diritto all'oblio”): con il pulsante “Elimina account”.</li>
          <li><strong>Portabilità:</strong> esporta i tuoi dati in formato JSON dalla pagina Account.</li>
          <li><strong>Revoca del consenso</strong> alle analytics: dalla pagina Account, senza pregiudicare la liceità del trattamento precedente.</li>
          <li><strong>Opposizione e limitazione</strong>, scrivendo al Titolare.</li>
        </ul>
        <p>
          Hai inoltre il diritto di proporre reclamo al{" "}
          <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="font-semibold text-sam-green hover:underline">
            Garante per la protezione dei dati personali
          </a>
          .
        </p>
      </Section>

      <Section title="8. Minori">
        <p>
          Il servizio non è destinato a minori di 16 anni. Registrandoti dichiari di avere almeno 16 anni.
        </p>
      </Section>

      <Section title="9. Modifiche a questa informativa">
        <p>
          Potremmo aggiornare questa informativa. In caso di modifiche sostanziali ti chiederemo un nuovo
          consenso. La versione corrente è indicata in cima alla pagina.
        </p>
      </Section>

      <p className="mt-10 text-sm">
        <Link href="/cookie" className="font-semibold text-sam-green hover:underline">
          → Leggi anche la Cookie policy
        </Link>
      </p>
    </div>
  );
}
