import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n";

// Cookie con la scelta esplicita dell'utente (impostato da LanguageSwitcher).
export const LANG_COOKIE = "sam:lang";

// Route senza versione per lingua: route handler e file di metadata.
const NOT_LOCALIZED = ["/auth", "/account/export", "/robots.txt", "/sitemap.xml", "/opengraph-image"];

const isNotLocalized = (pathname) =>
  NOT_LOCALIZED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

const prefixedLocale = (pathname) =>
  LOCALES.find(
    (l) => l !== DEFAULT_LOCALE && (pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  );

/**
 * Lingua preferita secondo Accept-Language: italiano solo se è la prima lingua
 * dichiarata dal browser, altrimenti inglese.
 */
function preferredLocale(acceptLanguage = "") {
  const first = acceptLanguage.split(",")[0]?.trim().toLowerCase() || "";
  return first.startsWith("it") ? "it" : "en";
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (isNotLocalized(pathname)) return await updateSession(request);

  // URL già in inglese (/en/...): nessuna riscrittura, ci pensa app/[lang].
  if (prefixedLocale(pathname)) return await updateSession(request);

  // URL senza prefisso = italiano.
  //
  // Chi ha scelto esplicitamente l'inglese col tasto (cookie) viene portato
  // sulla versione EN di QUALSIASI pagina, anche aprendo un link italiano.
  // Il fiuto automatico dall'header del browser, invece, agisce solo sulla
  // home: applicarlo ovunque sposterebbe i crawler (che di norma non mandano
  // Accept-Language, ma se lo fanno è in inglese) fuori dalle URL italiane
  // che devono indicizzare.
  const chosen = request.cookies.get(LANG_COOKIE)?.value;
  const acceptLanguage = request.headers.get("accept-language") || "";
  const sniffed = !chosen && acceptLanguage && preferredLocale(acceptLanguage) === "en";

  if (chosen === "en" || (sniffed && pathname === "/")) {
    const target = request.nextUrl.clone();
    target.pathname = `/en${pathname === "/" ? "" : pathname}`;
    return await updateSession(request, () => NextResponse.redirect(target));
  }

  // Rewrite interno: l'URL mostrato resta /spaces, il contenuto arriva da
  // app/[lang]/spaces con lang="it".
  const rewritten = request.nextUrl.clone();
  rewritten.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return await updateSession(request, (req) => NextResponse.rewrite(rewritten, { request: req }));
}

export const config = {
  // Esclude asset statici e immagini.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
