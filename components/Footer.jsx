"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { stripLocale } from "@/lib/i18n";

// Footer speculare per le due sezioni. In SAM for Work la classe .theme-work
// trasforma lo sfondo verde in bordeaux (vedi globals.css) e i link puntano a
// /work/*; il logo diventa la valigetta.
export default function Footer() {
  const { t, href } = useI18n();
  const pathname = stripLocale(usePathname() || "/");
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
            <span className="font-display text-xl font-bold">{isWork ? t.brand.work : t.brand.sam}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-sam-paper/70">
            {isWork ? t.footer.taglineWork : t.footer.taglineSam}
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-sam-paper">{t.footer.explore}</h4>
          <ul className="mt-3 space-y-2 text-sm text-sam-paper/70">
            <li><Link href={href(`${prefix}/spaces`)} className="hover:text-sam-paper">{isWork ? t.footer.allCoworking : t.footer.allSpaces}</Link></li>
            <li><Link href={href(`${prefix}/map`)} className="hover:text-sam-paper">{t.footer.map}</Link></li>
            <li><Link href={href(`${prefix}/favorites`)} className="hover:text-sam-paper">{t.footer.favorites}</Link></li>
          </ul>
        </div>

        {isWork ? (
          <div>
            <h4 className="font-display text-sm font-semibold text-sam-paper">{t.footer.lookingElse}</h4>
            <ul className="mt-3 space-y-2 text-sm text-sam-paper/70">
              <li><Link href={href("/")} className="hover:text-sam-paper">{t.footer.samLink}</Link></li>
            </ul>
          </div>
        ) : (
          <div>
            <h4 className="font-display text-sm font-semibold text-sam-paper">{t.footer.types}</h4>
            <ul className="mt-3 space-y-2 text-sm text-sam-paper/70">
              {/* Il valore di ?type= deve combaciare con lo `type` degli spazi. */}
              <li><Link href={href("/spaces?type=Caffetteria")} className="hover:text-sam-paper">{t.footer.cafes}</Link></li>
              <li><Link href={href("/spaces?type=Biblioteca")} className="hover:text-sam-paper">{t.footer.libraries}</Link></li>
              <li><Link href={href("/spaces?type=Libreria")} className="hover:text-sam-paper">{t.footer.bookshops}</Link></li>
              <li><Link href={href("/work")} className="hover:text-sam-paper">{t.footer.coworkingLink}</Link></li>
            </ul>
          </div>
        )}

        <div>
          <h4 className="font-display text-sm font-semibold text-sam-paper">{t.footer.contact}</h4>
          <ul className="mt-3 space-y-2 text-sm text-sam-paper/70">
            <li><a href="mailto:info@studyareasmilan.it" className="hover:text-sam-paper">info@studyareasmilan.it</a></li>
            <li>{t.footer.city}</li>
            <li><Link href={href("/privacy")} className="hover:text-sam-paper">{t.footer.privacy}</Link></li>
            <li><Link href={href("/cookie")} className="hover:text-sam-paper">{t.footer.cookie}</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-sam-paper/10 py-4">
        <div className="container-sam flex flex-col items-center justify-between gap-2 text-xs text-sam-paper/50 sm:flex-row">
          <span>© {new Date().getFullYear()} SAM — Study Areas Milan</span>
          <div className="flex items-center gap-3">
            <Link href={href("/privacy")} className="hover:text-sam-paper/80">{t.footer.privacyShort}</Link>
            <Link href={href("/cookie")} className="hover:text-sam-paper/80">{t.footer.cookieShort}</Link>
            <span>{t.footer.madeWith}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
