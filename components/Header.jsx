"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthNav from "./AuthNav";
import MobileMenu from "./MobileMenu";

// SAM e SAM for Work condividono la stessa struttura ma temi opposti:
//  - SAM      → verde, logo SAM, link /spazi /mappa /preferiti
//  - for Work → rosso (classe .theme-work rimappa i verdi su bordeaux),
//               logo valigetta, link /work/*
export default function Header() {
  const pathname = usePathname() || "/";
  const isWork = pathname === "/work" || pathname.startsWith("/work/");
  const prefix = isWork ? "/work" : "";

  return (
    <header
      className={`sticky top-0 z-40 border-b border-sam-cream bg-sam-paper/80 backdrop-blur ${
        isWork ? "theme-work" : ""
      }`}
    >
      <div className="container-sam flex h-16 items-center justify-between">
        <Link href={isWork ? "/work" : "/"} className="flex items-center gap-2">
          {isWork ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/sam-work-icon.png" alt="SAM for Work" className="h-11 w-auto" />
              <span className="font-display text-xl font-bold text-sam-green">SAM for Work</span>
            </>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/sam-icon.svg" alt="SAM" className="h-14 w-auto" />
              <span className="font-display text-xl font-bold text-sam-green">SAM</span>
              <span className="hidden text-sm text-sam-muted sm:inline">Study Areas Milan</span>
            </>
          )}
        </Link>

        {/* Navigazione desktop (da md in su) */}
        <nav className="hidden items-center gap-1 sm:gap-2 md:flex">
          <Link href={`${prefix}/spaces`} className="rounded-full px-3 py-2 text-sm font-semibold text-sam-brown transition hover:bg-sam-cream">
            Spazi
          </Link>
          <Link href={`${prefix}/map`} className="rounded-full px-3 py-2 text-sm font-semibold text-sam-brown transition hover:bg-sam-cream">
            Mappa
          </Link>
          <Link href={`${prefix}/favorites`} className="btn-primary ml-1">
            ♥ Preferiti
          </Link>
          <AuthNav />
        </nav>

        {/* Menu mobile (sotto md) */}
        <div className="md:hidden">
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
