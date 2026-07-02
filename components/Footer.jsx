import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-sam-cream bg-sam-green text-sam-paper">
      <div className="container-sam grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sam-paper font-display text-lg font-bold text-sam-green">
              S
            </span>
            <span className="font-display text-xl font-bold">SAM</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-sam-paper/70">
            Study Areas Milano — trova il posto giusto per studiare e lavorare in città.
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-sam-paper">Esplora</h4>
          <ul className="mt-3 space-y-2 text-sm text-sam-paper/70">
            <li><Link href="/spaces" className="hover:text-sam-paper">Tutti gli spazi</Link></li>
            <li><Link href="/spaces?view=map" className="hover:text-sam-paper">Mappa</Link></li>
            <li><Link href="/favorites" className="hover:text-sam-paper">Preferiti</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-sam-paper">Tipi</h4>
          <ul className="mt-3 space-y-2 text-sm text-sam-paper/70">
            <li>Caffetterie</li>
            <li>Biblioteche</li>
            <li>Coworking</li>
            <li>Librerie</li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-sam-paper">Contatti</h4>
          <ul className="mt-3 space-y-2 text-sm text-sam-paper/70">
            <li>info@sam-milano.it</li>
            <li>Milano, Italia</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-sam-paper/10 py-4">
        <div className="container-sam flex flex-col items-center justify-between gap-2 text-xs text-sam-paper/50 sm:flex-row">
          <span>© {new Date().getFullYear()} SAM — Study Areas Milano</span>
          <span>Fatto con ♥ a Milano</span>
        </div>
      </div>
    </footer>
  );
}
