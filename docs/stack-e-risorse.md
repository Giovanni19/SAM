# SAM — Stack tecnico e risorse del progetto

> Documento di riferimento: cosa usiamo, per cosa, e dove si gestisce ognuno.
> Aggiornare quando si aggiunge/cambia un servizio.

---

## 1. Panoramica

SAM (Study Areas Milano) è un sito web che aiuta a trovare posti dove
studiare/lavorare a Milano (caffetterie, biblioteche, coworking, librerie).
Gli utenti possono cercare, filtrare e salvare i preferiti (con un account).

---

## 2. Sviluppo e codice

| Aspetto | Strumento | Note |
|---|---|---|
| Framework sito | **Next.js 14** (React) | App Router, gira sia lato server che client |
| Stile grafico | **Tailwind CSS** | Classi di utilità, palette colori SAM definita in `tailwind.config.js` |
| Font | **Google Fonts** (Poppins, Nunito) | Caricati automaticamente da Next.js |
| Mappa interattiva | **Leaflet / react-leaflet** | Libreria open-source per la mappa dei posti |
| Codice sorgente | **GitHub** — repo `Giovanni19/SAM` | Tutto il codice versionato qui, branch `main` |
| Editor/assistente | **Claude Code** | Usato per scrivere e modificare il codice del sito |

**Dove si lavora:** in locale, cartella `/Users/giovanni/SAM/sam-web`, con
`npm run dev` per vedere il sito su `http://localhost:3000`.

---

## 3. Dati dei "posti" (caffetterie, biblioteche, ecc.)

| Aspetto | Strumento | Note |
|---|---|---|
| Database contenuti | **Notion** | Database "Places" — qui si gestiscono i posti mostrati sul sito |
| Collegamento sito ↔ Notion | **Notion API** (`@notionhq/client`) | Il sito legge da Notion se `USE_MOCK_DATA=false` e c'è un token valido |
| Stato attuale | ⚠️ **`USE_MOCK_DATA=true`** | Il sito mostra uno snapshot statico locale (91 posti), NON dati live da Notion |
| Arricchimento dati iniziale | **SerpApi** (script una tantum) | Usato una volta per recuperare foto/orari/rating da Google Maps e popolare lo snapshot iniziale — non è una connessione live nel sito |

**Per attivare Notion live:** creare un'integrazione su
notion.so/my-integrations, condividere il database "Places" con
l'integrazione, impostare `NOTION_TOKEN` e `USE_MOCK_DATA=false` nel file
`.env.local`.

---

## 4. Utenti, login e preferiti

| Aspetto | Strumento | Note |
|---|---|---|
| Autenticazione (login/registrazione) | **Supabase Auth** | Progetto Supabase ID `inpdrtlueuicwjmpuxbr` |
| Database utenti/preferiti | **Supabase (Postgres)** | Tabelle `profiles` (dati utente) e `favorites` (posti salvati) |
| Sicurezza dati | **Row Level Security (RLS)** | Ogni utente vede/modifica solo i propri dati (già configurato in `supabase/schema.sql`) |
| Metodi di accesso disponibili | Email+password, Magic Link, Reset password | Tutti via Supabase Auth |

**Dove si gestisce:** dashboard supabase.com → progetto SAM →
Authentication (utenti) e Table Editor (dati).

---

## 5. Dominio ed email

| Aspetto | Strumento | Note |
|---|---|---|
| Dominio del sito | **Register.it** | Dominio acquistato, gestione DNS anche qui |
| Casella email personale | **Register.it Mail** | Collegata a Outlook via IMAP/SMTP, per la mail "umana" |
| Email automatiche del sito (conferma registrazione, reset password) | **Resend** *(in configurazione)* | Servizio dedicato alle email automatiche, separato dalla casella personale — vedi sezione 7 |
| Indirizzo di contatto pubblico | `info@studyareasmilan.it` | Mostrato nel footer del sito |

---

## 6. Identità visiva (brand/design)

| Aspetto | Dove si trova |
|---|---|
| Icona/logo SAM | `public/brand/sam-icon.svg` nel codice del sito |
| Palette colori | Definita in `tailwind.config.js` (verde `#1F4D3D`, arancio `#E0734F`, ecc.) |
| Regola per nuovi asset | Tutto ciò che è grafica/design va in `public/brand/` (loghi/icone) o `public/images/` (foto/illustrazioni) — vedi `public/README.md` |
| Template email brandizzati | `supabase/email-templates/` (HTML pronti da incollare su Supabase) |

---

## 7. Hosting del sito (⚠️ da fare)

Al momento il sito **gira solo in locale** (sul tuo computer, con
`npm run dev`). Non è ancora pubblicato online su un indirizzo pubblico.
Per renderlo raggiungibile da chiunque serve un servizio di hosting (es.
**Vercel**, il più naturale per un progetto Next.js — ha un piano gratuito
adatto a questa fase). Da fare quando si è pronti ad andare online.

---

## 8. Riepilogo — chi fa cosa

| Servizio | A cosa serve | Costo attuale |
|---|---|---|
| GitHub | Codice sorgente | Gratis |
| Supabase | Login utenti + database preferiti | Gratis (piano free) |
| Notion | Contenuti dei posti (in pausa, usa dati locali) | Gratis |
| Register.it | Dominio + casella email personale | Pagato (dominio) |
| Resend | Invio email automatiche del sito | Gratis fino a 3.000 email/mese |
| Vercel *(da attivare)* | Hosting pubblico del sito | Gratis (piano free) |

---

## 9. Credenziali e chiavi

Le chiavi segrete (token Supabase, eventuale token Notion, API key Resend)
**non sono in questo documento** e non vanno mai condivise qui. Vivono nel
file `.env.local` sul computer (mai caricato su GitHub) e nelle dashboard
dei rispettivi servizi (supabase.com, resend.com, register.it).
