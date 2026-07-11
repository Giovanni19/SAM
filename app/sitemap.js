import { getSpaces } from "@/lib/notion";

const BASE_URL = "https://www.studyareasmilan.it";

// Pagine statiche di contenuto. Escluse volutamente le route di auth/account
// (login, signup, account, ecc.): non hanno valore SEO e sono specifiche per
// utente, coerenti con il disallow in robots.js.
const STATIC_PATHS = [
  { path: "", priority: 1 },
  { path: "/spaces", priority: 0.9 },
  { path: "/map", priority: 0.6 },
  { path: "/privacy", priority: 0.3 },
  { path: "/cookie", priority: 0.3 },
  { path: "/work", priority: 1 },
  { path: "/work/spaces", priority: 0.9 },
  { path: "/work/map", priority: 0.6 },
];

/** Sitemap generata da Next.js su /sitemap.xml (App Router file convention). */
export default async function sitemap() {
  const spaces = await getSpaces();
  const now = new Date();

  const staticEntries = STATIC_PATHS.map(({ path, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    priority,
  }));

  // SAM mostra tutto tranne i coworking; SAM for Work mostra solo i coworking
  // (stessa regola di generateStaticParams in app/spaces/[id] e app/work/spaces/[id]).
  const samEntries = spaces
    .filter((s) => s.type !== "Coworking")
    .map((s) => ({ url: `${BASE_URL}/spaces/${s.id}`, lastModified: now, priority: 0.7 }));

  const workEntries = spaces
    .filter((s) => s.type === "Coworking")
    .map((s) => ({ url: `${BASE_URL}/work/spaces/${s.id}`, lastModified: now, priority: 0.7 }));

  return [...staticEntries, ...samEntries, ...workEntries];
}
