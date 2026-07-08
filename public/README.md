# Asset statici

Tutto ciò che sta in `public/` viene servito dalla root del sito.
Esempio: `public/brand/sam-icon.svg` → raggiungibile all'URL `/brand/sam-icon.svg`.

## Dove salvare cosa

- **`public/brand/`** — logo, icone e elementi di identità visiva (loghi, favicon, monogrammi).
- **`public/images/`** — foto e immagini di contenuto (illustrazioni, sfondi, foto dei posti se locali).

## Come usarli nel codice

Si referenziano con un percorso assoluto che parte dalla root (senza `public/`):

```jsx
<img src="/brand/sam-icon.svg" alt="SAM" className="h-10 w-auto" />
```

Regola pratica: **nuove immagini o asset di design → mettili qui**, nella
sottocartella giusta, e referenziali con `/<sottocartella>/<file>`.
