import { LOCALES, DEFAULT_LOCALE } from "@/lib/i18n";

const BASE_URL = "https://www.studyareasmilan.it";

// Route senza valore SEO o specifiche per utente: fuori dall'indicizzazione.
const PRIVATE_PATHS = [
  "/account",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/favorites",
  "/work/favorites",
];

// Le stesse route vanno escluse anche nella versione inglese (/en/login…).
const DISALLOW = LOCALES.flatMap((lang) =>
  PRIVATE_PATHS.map((p) => (lang === DEFAULT_LOCALE ? p : `/${lang}${p}`))
);

/** robots.txt generato da Next.js su /robots.txt (App Router file convention). */
export default function robots() {
  return {
    rules: [
      // Regola generale per tutti i crawler (motori di ricerca "classici").
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      // Crawler di RICERCA delle AI answer engine (recuperano pagine in tempo
      // reale per rispondere e citare le fonti): li lasciamo passare esplicitamente.
      { userAgent: "OAI-SearchBot", allow: "/", disallow: DISALLOW },
      { userAgent: "Claude-SearchBot", allow: "/", disallow: DISALLOW },
      { userAgent: "Claude-User", allow: "/", disallow: DISALLOW },
      { userAgent: "PerplexityBot", allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
