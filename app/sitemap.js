import { getSpaces } from "@/lib/notion";
import { isStudySpace, isCoworking } from "@/lib/utils";
import { DEFAULT_LOCALE, LOCALES, localeHref } from "@/lib/i18n";

const BASE_URL = "https://www.studyareasmilan.it";

// Pagine statiche di contenuto. Escluse volutamente le route di auth/account
// (login, signup, account, ecc.): non hanno valore SEO e sono specifiche per
// utente, coerenti con il disallow in robots.js.
const STATIC_PATHS = [
  { path: "/", priority: 1 },
  { path: "/spaces", priority: 0.9 },
  { path: "/map", priority: 0.6 },
  { path: "/privacy", priority: 0.3 },
  { path: "/cookie", priority: 0.3 },
  { path: "/work", priority: 1 },
  { path: "/work/spaces", priority: 0.9 },
  { path: "/work/map", priority: 0.6 },
];

// Ogni URL dichiara le proprie alternative di lingua: Google così sa che
// /spaces e /en/spaces sono la stessa pagina in lingue diverse e non le tratta
// come contenuti duplicati.
function alternates(path) {
  return {
    languages: Object.fromEntries(
      LOCALES.map((lang) => [lang, `${BASE_URL}${localeHref(lang, path)}`])
    ),
  };
}

// Una voce per lingua, ciascuna con i link hreflang all'altra.
function entries(path, priority, lastModified) {
  return LOCALES.map((lang) => ({
    url: `${BASE_URL}${localeHref(lang, path)}`,
    lastModified,
    // L'italiano è la lingua principale: le pagine EN valgono un filo meno.
    priority: lang === DEFAULT_LOCALE ? priority : Math.max(0.1, priority - 0.1),
    alternates: alternates(path),
  }));
}

/** Sitemap generata da Next.js su /sitemap.xml (App Router file convention). */
export default async function sitemap() {
  const spaces = await getSpaces();
  const now = new Date();

  const staticEntries = STATIC_PATHS.flatMap(({ path, priority }) =>
    entries(path, priority, now)
  );

  // SAM mostra tutto tranne i coworking puri; SAM for Work mostra i coworking
  // (stessa regola di generateStaticParams in app/[lang]/spaces/[id] e
  // app/[lang]/work/spaces/[id]). Un posto con più categorie compare in entrambe.
  const samEntries = spaces
    .filter(isStudySpace)
    .flatMap((s) => entries(`/spaces/${s.id}`, 0.7, now));

  const workEntries = spaces
    .filter(isCoworking)
    .flatMap((s) => entries(`/work/spaces/${s.id}`, 0.7, now));

  return [...staticEntries, ...samEntries, ...workEntries];
}
