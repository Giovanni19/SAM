import Link from "next/link";
import AuthNav from "./AuthNav";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-sam-cream bg-sam-paper/80 backdrop-blur">
      <div className="container-sam flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/sam-icon.svg" alt="SAM" className="h-14 w-auto" />
          <span className="font-display text-xl font-bold text-sam-green">SAM</span>
          <span className="hidden text-sm text-sam-muted sm:inline">Study Areas Milano</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/spaces" className="rounded-full px-3 py-2 text-sm font-semibold text-sam-brown transition hover:bg-sam-cream">
            Spazi
          </Link>
          <Link href="/map" className="rounded-full px-3 py-2 text-sm font-semibold text-sam-brown transition hover:bg-sam-cream">
            Mappa
          </Link>
          <Link href="/favorites" className="btn-primary ml-1">
            ♥ Preferiti
          </Link>
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}
