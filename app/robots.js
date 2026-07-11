const BASE_URL = "https://www.studyareasmilan.it";

// Route senza valore SEO o specifiche per utente: fuori dall'indicizzazione.
const DISALLOW = [
  "/account",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/favorites",
  "/work/favorites",
];

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
