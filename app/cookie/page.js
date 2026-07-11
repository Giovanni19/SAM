import Link from "next/link";

export const metadata = {
  title: "Cookie policy — SAM",
  description: "Quali cookie usa SAM — Study Areas Milan e perché.",
};

export default function CookiePage() {
  return (
    <div className="container-sam max-w-3xl py-12">
      <h1 className="font-display text-3xl font-bold text-sam-green">Cookie policy</h1>
      <p className="mt-2 text-sm text-sam-muted">
        Come SAM utilizza i cookie e le tecnologie simili.
      </p>

      <section className="mt-8 space-y-2 text-sm leading-relaxed text-sam-brown/90">
        <p>
          SAM utilizza <strong>esclusivamente cookie tecnici necessari</strong> al funzionamento del
          sito. Per questi cookie <strong>non è richiesto il consenso</strong>, come previsto dalla
          normativa (art. 122 del Codice Privacy e Linee guida del Garante).
        </p>
        <p>
          Non utilizziamo cookie di profilazione pubblicitaria né strumenti di tracciamento di terze
          parti. Se in futuro introdurremo cookie non necessari, ti chiederemo il consenso preventivo
          tramite un apposito banner.
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
