"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, getDictionary, localeHref } from "@/lib/i18n";

// Rende lingua e dizionario disponibili a tutti i componenti client senza
// doverli passare di prop in prop. I componenti server usano invece
// getDictionary(lang) direttamente, con lang che arriva da params.
const I18nContext = createContext(null);

export function useI18n() {
  const ctx = useContext(I18nContext);
  // Fallback difensivo: se un componente client finisse fuori dal provider
  // mostra comunque l'italiano invece di esplodere.
  if (!ctx) {
    return {
      lang: DEFAULT_LOCALE,
      t: getDictionary(DEFAULT_LOCALE),
      href: (path) => localeHref(DEFAULT_LOCALE, path),
    };
  }
  return ctx;
}

export default function I18nProvider({ lang, children }) {
  const value = useMemo(
    () => ({
      lang,
      t: getDictionary(lang),
      // Prefissa i link interni con la lingua corrente.
      href: (path) => localeHref(lang, path),
    }),
    [lang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
