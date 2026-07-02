# SAM — Study Areas Milano

Piattaforma web per scoprire i migliori spazi dove **studiare e lavorare a Milano**:
caffetterie, biblioteche, coworking e librerie, con info su WiFi, prese, sedute,
rumore e possibilità di permanenza.

I dati provengono da un database **Notion** ("Places") con oltre 90 posti curati,
ciascuno con un *Study Score* (0–100).

## Stack

- **Next.js 14** (App Router) + **React 18**
- **Tailwind CSS 3** (tema brand SAM)
- **@notionhq/client** / **Axios** per i dati da Notion

## Avvio rapido

```bash
cd sam-web
npm install
npm run dev
```

Apri **http://localhost:3000**.

Di default l'app usa uno **snapshot locale reale** dei posti (`USE_MOCK_DATA=true`
in `.env.local`), quindi funziona subito senza configurare Notion.

## Collegare Notion (dati in tempo reale)

1. Crea un'integrazione su https://www.notion.so/my-integrations e copia il token.
2. Condividi il database **"Places"** con l'integrazione (••• → Connections).
3. In `.env.local`:
   ```
   NOTION_TOKEN=secret_xxx
   USE_MOCK_DATA=false
   ```
   Il database ID è già impostato di default in `lib/notion.js`.

La mappatura delle property Notion → app è in `lib/notion.js` (`normalizeSpace`).

## Funzionalità

- 🏠 Home con gli spazi migliori (ordinati per Study Score)
- 🔎 Ricerca e filtri per **zona** e **tipo** di spazio
- 📄 Pagina di dettaglio con i sotto-punti: WiFi, prese, sedute, rumore, permanenza
- ♥ Preferiti salvati in `localStorage`
- 📱 Design responsive (mobile-first)

## Struttura

```
sam-web/
├── app/
│   ├── layout.js                 # Layout root (Header + Footer, font)
│   ├── page.js                   # Home
│   ├── spaces/
│   │   ├── page.js               # Lista spazi + filtri
│   │   └── [id]/page.js          # Dettaglio spazio
│   └── favorites/page.js         # Preferiti
├── components/
│   ├── Header.jsx  Footer.jsx
│   ├── SearchBar.jsx             # Filtri Zona + Tipo + pulsante Cerca
│   ├── SpacesExplorer.jsx        # Ricerca + lista con filtro applicato
│   ├── SpaceCard.jsx  SpaceList.jsx
│   ├── FavoriteButton.jsx  FavoritesGrid.jsx
├── lib/
│   ├── notion.js                 # Fetch + normalizzazione dati Notion
│   ├── mockData.js               # Snapshot reale (fallback senza token)
│   ├── utils.js                  # Tipi, amenità, zone, punteggio
│   └── useFavorites.js           # Hook localStorage
└── styles/globals.css
```

## Prossimi passi

- 🗺️ Mappa interattiva (geocoding indirizzi → lat/lng + react-leaflet)
- 🖼️ Foto dei luoghi
- 🔤 Ricerca testuale per nome

---

_Fatto con ♥ a Milano._
