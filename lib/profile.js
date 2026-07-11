// Opzioni per la profilazione utente: raccolte (facoltative) in fase di
// registrazione e usate per le analytics da mostrare ai clienti B2B.

export const OCCUPATIONS = [
  { value: "studente", label: "Studente" },
  { value: "lavoratore", label: "Lavoratore" },
  { value: "libero_professionista", label: "Libero professionista" },
];

// Principali atenei di Milano (+ "Altro" per chi non è in lista).
export const MILAN_UNIVERSITIES = [
  "Università Bocconi",
  "Politecnico di Milano",
  "Università degli Studi di Milano (Statale)",
  "Università degli Studi di Milano-Bicocca",
  "Università Cattolica del Sacro Cuore",
  "IULM",
  "Università Vita-Salute San Raffaele",
  "Humanitas University",
  "NABA — Nuova Accademia di Belle Arti",
  "Accademia di Belle Arti di Brera",
  "Altro",
];

export const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55+"];

// Versione dell'informativa privacy vigente. Va aggiornata a ogni revisione
// sostanziale del testo in `app/privacy/page.js`, così sappiamo a quale
// versione ha aderito ciascun utente (e possiamo richiedere un nuovo consenso).
export const PRIVACY_VERSION = "2026-07-09";

// Testo unico della finalità B2B: usato al signup e nell'area account, così la
// descrizione del consenso resta identica ovunque.
export const ANALYTICS_CONSENT_LABEL =
  "Acconsento al trattamento di occupazione, università e fascia d'età per finalità " +
  "di analisi statistica aggregata, incluse le analytics fornite a partner e clienti " +
  "business di SAM. È facoltativo e revocabile in qualsiasi momento.";
