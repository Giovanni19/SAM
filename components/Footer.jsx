"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Footer speculare per le due sezioni. In SAM for Work la classe .theme-work
// trasforma lo sfondo verde in bordeaux (vedi globals.css) e i link puntano a
// /work/*; il logo diventa la valigetta.
export default function Footer() {
  const pathname = usePathname() || "/";
  const isWork = pathname === "/work" || pathname.startsWith("/work/");
  const prefix = isWork ? "/work" : "";

  return (
    <footer
      className={`mt-16 border-t border-sam-cream text-sam-paper ${
        isWork ? "bg-sam-work" : "bg-sam-green"
      }`}
    >
      <div className="container-sam grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2">
            <span className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full bg-sam-paper">
              {isWork ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/brand/sam-work-icon.png" alt="SAM for Work" className="h-11 w-11" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/brand/sam-icon.svg" alt="SAM" className="h-14 w-14" />
              )}
            </span>
            <span className="font-display text-xl font-bold">{isWork ? "SAM for Work" : "SAM"}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-sam-paper/70">
            {isWork
              ? "SAM for Work — i coworking di Milano per lavorare e per i team commerciali."
              : "Study Areas Milan — trova il posto giusto per studiare in città."}
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-sam-paper">Esplora</h4>
          <ul className="mt-3 space-y-2 text-sm text-sam-paper/70">
            <li><Link href={`${prefix}/spaces`} className="hover:text-sam-paper">{isWork ? "Tutti i coworking" : "Tutti gli spazi"}</Link></li>
            <li><Link href={`${prefix}/map`} className="hover:text-sam-paper">Mappa</Link></li>
            <li><Link href={`${prefix}/favorites`} className="hover:text-sam-paper">Preferiti</Link></li>
          </ul>
        </div>

        {isWork ? (
          <div>
            <h4 className="font-display text-sm font-semibold text-sam-paper">Cerchi altro?</h4>
            <ul className="mt-3 space-y-2 text-sm text-sam-paper/70">
              <li><Link href="/" className="hover:text-sam-paper">📚 Vai a SAM (studio)</Link></li>
            </ul>
          </div>
        ) : (
          <div>
            <h4 className="font-display text-sm font-semibold text-sam-paper">Tipi</h4>
            <ul className="mt-3 space-y-2 text-sm text-sam-paper/70">
              {/* Il valore di ?type= deve combaciare con lo `type` degli spazi. */}
              <li><Link href="/spaces?type=Caffetteria" className="hover:text-sam-paper">Caffetterie</Link></li>
              <li><Link href="/spaces?type=Biblioteca" className="hover:text-sam-paper">Biblioteche</Link></li>
              <li><Link href="/spaces?type=Libreria" className="hover:text-sam-paper">Librerie</Link></li>
              <li><Link href="/work" className="hover:text-sam-paper">💼 Coworking → SAM for Work</Link></li>
            </ul>
          </div>
        )}

        <div>
          <h4 className="font-display text-sm font-semibold text-sam-paper">Contatti & Legale</h4>
          <ul className="mt-3 space-y-2 text-sm text-sam-paper/70">
            <li><a href="mailto:info@studyareasmilan.it" className="hover:text-sam-paper">info@studyareasmilan.it</a></li>
            <li>Milano, Italia</li>
            <li><Link href="/privacy" className="hover:text-sam-paper">Informativa privacy</Link></li>
            <li><Link href="/cookie" className="hover:text-sam-paper">Cookie policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-sam-paper/10 py-4">
        <div className="container-sam flex flex-col items-center justify-between gap-2 text-xs text-sam-paper/50 sm:flex-row">
          <span>© {new Date().getFullYear()} SAM — Study Areas Milan</span>
          <div className="flex items-center gap-3">
            <Link href="/privacy" className="hover:text-sam-paper/80">Privacy</Link>
            <Link href="/cookie" className="hover:text-sam-paper/80">Cookie</Link>
            <span>Fatto con ♥ a Milano</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
