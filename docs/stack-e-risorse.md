# SAM — Stack tecnico, risorse e roadmap

> Documento di riferimento: cosa usiamo, per cosa, e dove si gestisce ognuno.
> Aggiornare quando si aggiunge/cambia un servizio.

---

## 1. Panoramica

SAM (Study Areas Milan) è un sito web che aiuta a trovare posti dove
studiare/lavorare a Milano (caffetterie, biblioteche, coworking, librerie).
Gli utenti possono cercare, filtrare (previa registrazione) e salvare i
preferiti. Il sito è **online** su `https://studyareasmilan.it`.

---

## 2. Sviluppo e codice

| Aspetto | Strumento | Note |
|---|---|---|
| Framework sito | **Next.js 14** (React) | App Router, gira sia lato server che client |
| Stile grafico | **Tailwind CSS** | Mobile-first, palette colori SAM in `tailwind.config.js` |
| Font | **Google Fonts** (Poppins, Nunito) | Caricati automaticamente da Next.js |
| Mappa interattiva | **Leaflet / react-leaflet** | Libreria open-source per la mappa dei posti |
| Codice sorgente | **GitHub** — repo `Giovanni19/SAM` | Branch `main` |
| Hosting/Deploy | **Vercel** | Build e deploy automatici a ogni push su `main` |
| Editor/assistente | **Claude Code** | Usato per scrivere e modificare il codice del sito |

**Sviluppo locale:** `/Users/giovanni/SAM/sam-web`, con `npm run dev` →
`http://localhost:3000`.

**Pipeline di pubblicazione:** push su GitHub → Vercel builda e pubblica in
automatico su `studyareasmilan.it` in 1-2 minuti. Non c'è ancora uno step di
anteprima separato prima della produzione (i Preview Deployment di Vercel
sono disponibili ma non ancora adottati come workflow standard — vedi
sezione 10).

---

## 3. Dati dei "posti" (caffetterie, biblioteche, ecc.)

| Aspetto | Strumento | Note |
|---|---|---|
| Database contenuti | **Notion** | Database "Places" — qui si gestiscono i posti mostrati sul sito |
| Collegamento sito ↔ Notion | **Notion API** (`@notionhq/client`) | Il sito legge da Notion se `USE_MOCK_DATA=false` e c'è un token valido |
| Stato attuale | ⚠️ **`USE_MOCK_DATA=true`** | Il sito mostra uno snapshot statico locale (91 posti), NON dati live da Notion |
| Arricchimento dati iniziale | **SerpApi** (script una tantum) | Usato una volta per recuperare foto/orari/rating da Google Maps — non è una connessione live nel sito |

**Per attivare Notion live:** creare un'integrazione su
notion.so/my-integrations, condividere il database "Places" con
l'integrazione, impostare `NOTION_TOKEN` e `USE_MOCK_DATA=false`
(sia in `.env.local` che tra le Environment Variables di Vercel).

---

## 4. Utenti, login, profilo e preferiti

| Aspetto | Strumento | Note |
|---|---|---|
| Autenticazione | **Supabase Auth** | Progetto ID `inpdrtlueuicwjmpuxbr` |
| Database utenti/preferiti | **Supabase (Postgres)** | Tabelle `profiles` e `favorites` |
| Sicurezza dati | **Row Level Security (RLS)** | Ogni utente vede/modifica solo i propri dati |
| Metodi di accesso | Email+password, Magic Link, Reset password | Tutti via Supabase Auth |
| Dati raccolti alla registrazione | Nome, cognome (obbligatori) + occupazione, università (se studente), fascia d'età (facoltativi) | Pensati per alimentare analytics future (sezione 9) |
| Gestione profilo | Pagina `/account` | L'utente vede e modifica i propri dati dopo il login |

**Dove si gestisce:** dashboard supabase.com → progetto SAM →
Authentication (utenti) e Table Editor (dati).

---

## 5. Dominio ed email

| Aspetto | Strumento | Note |
|---|---|---|
| Dominio del sito | **Register.it** | `studyareasmilan.it`, gestione DNS anche qui |
| Casella email personale | **Register.it Mail** | Collegata a Outlook via IMAP/SMTP |
| Email automatiche del sito (conferma registrazione, reset password, magic link) | **Resend** | Dominio verificato, collegato a Supabase come SMTP custom — mittente `noreply@studyareasmilan.it` |
| Template email | Brandizzati SAM | `supabase/email-templates/`, incollati in Supabase → Authentication → Email Templates |
| Indirizzo di contatto pubblico | `info@studyareasmilan.it` | Mostrato nel footer del sito |

---

## 6. Identità visiva (brand/design)

| Aspetto | Dove si trova |
|---|---|
| Icona/logo SAM | `public/brand/sam-icon.svg` |
| Palette colori | `tailwind.config.js` (verde `#1F4D3D`, arancio `#E0734F`, ecc.) |
| Regola per nuovi asset | `public/brand/` (loghi/icone) o `public/images/` (foto/illustrazioni) — vedi `public/README.md` |
| Template email brandizzati | `supabase/email-templates/` |
| Responsive | Header con menu hamburger sotto 768px, resto del sito mobile-first di base |

---

## 7. Hosting del sito

| Aspetto | Stato |
|---|---|
| Piattaforma | **Vercel** (piano gratuito) |
| Dominio collegato | `studyareasmilan.it` → record A su Register.it |
| HTTPS | Automatico (certificato gestito da Vercel) |
| Deploy | Automatico a ogni push su `main` |

---

## 8. Riepilogo — chi fa cosa

| Servizio | A cosa serve | Costo attuale |
|---|---|---|
| GitHub | Codice sorgente | Gratis |
| Vercel | Hosting pubblico del sito | Gratis (piano free) |
| Supabase | Login utenti + database preferiti/profili | Gratis (piano free) |
| Notion | Contenuti dei posti (in pausa, usa dati locali) | Gratis |
| Register.it | Dominio + casella email personale | Pagato (dominio) |
| Resend | Invio email automatiche del sito | Gratis fino a 3.000 email/mese |

---

## 9. Proposte future

### Analytics dettagliate (priorità: la richiesta più recente)

Oggi non c'è nessuno strumento di analytics collegato — non sappiamo quante
persone visitano il sito, cosa cercano, quali posti sono più popolari.
Obiettivo: dati abbastanza dettagliati da poter essere mostrati/venduti ai
clienti B2B (caffetterie, biblioteche, coworking) come valore aggiunto.

Si tratta di **due livelli distinti di analytics**, utili entrambi:

**A. Analytics di traffico/comportamento sul sito** (chi visita, da dove, cosa clicca)
- **Vercel Analytics** — nativo, si attiva con un click dalla dashboard Vercel già in uso, nessuna configurazione aggiuntiva. Piano gratuito con dati base (pagine viste, provenienza).
- **Plausible** o **PostHog** — alternative più orientate al prodotto: PostHog in particolare permette di tracciare eventi custom ("utente ha filtrato per zona X", "utente ha salvato posto Y nei preferiti", funnel di registrazione) e costruire dashboard interne — è lo strumento più adatto se l'obiettivo è "analisi dati dettagliate" da mostrare ai clienti.

**B. Analytics sui dati già raccolti nel database** (quello che già abbiamo)
Il database Supabase contiene già ingredienti preziosi che non sfruttiamo ancora:
- Tabella `favorites` → quali posti sono salvati più spesso, per zona/categoria
- Tabella `profiles` → distribuzione occupazione/università/età di chi usa SAM
- (da aggiungere) log delle ricerche/filtri usati, per capire cosa cercano davvero gli utenti

Con query SQL su questi dati si possono costruire report tipo *"il 60% di chi
salva posti in Città Studi è studente Bocconi/Polimi, principalmente nella
fascia 18-24, cerca soprattutto WiFi e prese"* — dati concreti e vendibili a
un cliente B2B.

**Consiglio pratico per iniziare:** attivare Vercel Analytics subito (gratis,
5 minuti) per avere un primo polso del traffico, poi valutare PostHog quando
si vuole passare a eventi custom e dashboard più ricche.

### Altre proposte

| Proposta | Perché | Priorità suggerita |
|---|---|---|
| Preview Deployment come workflow standard | Testare le modifiche prima che vadano live (vedi sezione 2) | Alta — basso sforzo, già disponibile su Vercel |
| Attivare Notion live (`USE_MOCK_DATA=false`) | I posti mostrati sono statici, non aggiornabili senza toccare codice | Media |
| Dashboard interna per i clienti B2B | Se le analytics diventano un prodotto da vendere, servirà un'interfaccia dedicata (non solo dati grezzi) | Bassa, dopo aver validato i dati |
| Notifiche email di riepilogo per i clienti | Es. "il tuo locale ha ricevuto 12 nuovi preferiti questa settimana" — usa Resend, già configurato | Bassa |
| Monitoraggio errori in produzione (es. Sentry) | Sapere quando qualcosa si rompe sul sito live senza aspettare che un utente lo segnali | Media |

---

## 10. Credenziali e chiavi

Le chiavi segrete (token Supabase, eventuale token Notion, API key Resend)
**non sono in questo documento** e non vanno mai condivise qui. Vivono nel
file `.env.local` sul computer (mai caricato su GitHub), tra le Environment
Variables di Vercel, e nelle dashboard dei rispettivi servizi (supabase.com,
resend.com, register.it).
