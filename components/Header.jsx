"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthNav from "./AuthNav";
import MobileMenu from "./MobileMenu";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "@/components/I18nProvider";
import { stripLocale } from "@/lib/i18n";

// SAM e SAM for Work condividono la stessa struttura ma temi opposti:
//  - SAM      → verde, logo SAM, link /spazi /mappa /preferiti
//  - for Work → rosso (classe .theme-work rimappa i verdi su bordeaux),
//               logo valigetta, link /work/*
export default function Header() {
  const { t, href } = useI18n();
  // Il pathname include il prefisso di lingua (/en/work): lo togliamo prima di
  // riconoscere la sezione, altrimenti in inglese il tema Work non scatterebbe.
  const pathname = stripLocale(usePathname() || "/");
  const isWork = pathname === "/work" || pathname.startsWith("/work/");
  const prefix = isWork ? "/work" : "";

  return (
    <header
      className={`sticky top-0 z-40 border-b border-sam-cream bg-sam-paper/80 backdrop-blur ${
        isWork ? "theme-work" : ""
      }`}
    >
      <div className="container-sam flex h-16 items-center justify-between">
        <Link href={href(isWork ? "/work" : "/")} className="flex items-center gap-2">
          {isWork ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/sam-work-icon.png" alt="SAM for Work" className="h-11 w-auto" />
              <span className="font-display text-xl font-bold text-sam-green">{t.brand.work}</span>
            </>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/sam-icon.svg" alt="SAM" className="h-14 w-auto" />
              <span className="font-display text-xl font-bold text-sam-green">{t.brand.sam}</span>
              <span className="hidden text-sm text-sam-muted sm:inline">{t.brand.samFull}</span>
            </>
          )}
        </Link>

        {/* Navigazione desktop (da md in su) */}
        <nav className="hidden items-center gap-1 sm:gap-2 md:flex">
          <Link
            href={href(`${prefix}/spaces`)}
            className="rounded-full px-3 py-2 text-sm font-semibold text-sam-brown transition hover:bg-sam-cream"
          >
            {t.nav.spaces}
          </Link>
          <Link
            href={href(`${prefix}/map`)}
            className="rounded-full px-3 py-2 text-sm font-semibold text-sam-brown transition hover:bg-sam-cream"
          >
            {t.nav.map}
          </Link>
          <Link href={href(`${prefix}/favorites`)} className="btn-primary ml-1">
            {t.nav.favorites}
          </Link>
          <AuthNav />
          <LanguageSwitcher />
        </nav>

        {/* Menu mobile (sotto md) */}
        <div className="flex items-center gap-1 md:hidden">
          <LanguageSwitcher />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
