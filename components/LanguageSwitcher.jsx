"use client";

import { usePathname, useRouter } from "next/navigation";
import { DEFAULT_LOCALE, LOCALES, localeHref, stripLocale } from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";
import { cn } from "@/lib/utils";

// Mostra la lingua verso cui si passa: sul sito italiano si legge "EN".
// La scelta viene salvata in un cookie, così il middleware la rispetta ai
// prossimi accessi invece di ridedurla dall'header del browser.
export default function LanguageSwitcher({ className }) {
  const { lang, t } = useI18n();
  const pathname = usePathname() || "/";
  const router = useRouter();

  const target = LOCALES.find((l) => l !== lang) || DEFAULT_LOCALE;

  function switchTo() {
    // Un anno; SameSite=Lax basta: il cookie serve solo alla navigazione diretta.
    document.cookie = `sam:lang=${target}; path=/; max-age=31536000; samesite=lax`;

    // La query string si legge qui e non con useSearchParams(): quel hook,
    // essendo questo componente nell'header di ogni pagina, obbligherebbe
    // l'intero sito al rendering dinamico (bailout dalla generazione statica).
    const query = typeof window !== "undefined" ? window.location.search : "";
    router.push(localeHref(target, stripLocale(pathname)) + query);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={switchTo}
      aria-label={t.nav.switchLanguage}
      className={cn(
        "rounded-full px-3 py-2 text-sm font-semibold uppercase text-sam-brown/50 transition hover:bg-sam-cream hover:text-sam-brown",
        className
      )}
    >
      {target}
    </button>
  );
}
