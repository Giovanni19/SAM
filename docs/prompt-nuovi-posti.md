Devo aggiungere nuovi posti a un database Notion che alimenta un sito web
(SAM — Study Areas Milan, spazi dove studiare/lavorare a Milano: caffetterie,
biblioteche, coworking, librerie). Genera una TABELLA con i posti che ti
indicherò (o che proponi tu, se te lo chiedo), con esattamente queste colonne,
nello stesso ordine, pronta da incollare in Notion:

| Nome | Indirizzo | Zona | Categoria | WiFi | Prese | Sedute | Rumore | Stay Policy | Latitude | Longitude | Descrizione IT | Google Maps | Sito Web | Foto | Rating | Recensioni | Telefono | Orari | Affollamento |

Regole per ogni colonna (rispettale alla lettera, sono valori a scelta fissa
usati dal sito):

- **Nome**: nome del locale/posto, come si chiama davvero.
- **Indirizzo**: indirizzo completo con CAP, es. "Via Roma 1, 20121 Milano".
- **Zona**: nome zona/quartiere di Milano (es. "Navigli", "Città Studi", "Isola"). Se non sei sicuro, lascia vuoto.
- **Categoria**: SOLO uno tra questi valori esatti (minuscolo): `cafe`, `library`, `coworking`, `bookstore`.
- **WiFi**: SOLO uno tra: `confermato`, `probabile`, `non verificato`, `assente`.
- **Prese**: SOLO uno tra: `abbondanti`, `alcune`, `assenti`, `non verificato`.
- **Sedute**: SOLO uno tra: `tavoli grandi`, `ok`, `sgabelli`.
- **Rumore**: SOLO uno tra: `quiet`, `moderate`, `lively`.
- **Stay Policy**: SOLO uno tra: `free` (puoi restare liberamente), `min_order` (serve una consumazione), `paid_pass` (ingresso a pagamento).
- **Latitude / Longitude**: coordinate GPS decimali del posto (es. 45.4642, 9.1900). Se non le conosci con certezza, stimale dall'indirizzo ma segnalamelo.
- **Descrizione IT**: 1-2 frasi in italiano che descrivono il posto e perché è adatto a studiare/lavorare.
- **Google Maps**: link diretto alla scheda Google Maps del posto, se lo trovi.
- **Sito Web**: sito ufficiale, se esiste. Altrimenti lascia vuoto.
- **Foto**: URL diretto a un'immagine (se non hai un URL affidabile, lascia vuoto — non inventarlo).
- **Rating**: voto Google (es. 4.3), se lo conosci. Altrimenti vuoto.
- **Recensioni**: numero di recensioni Google, se lo conosci. Altrimenti vuoto.
- **Telefono**: numero di telefono in formato internazionale (es. +39 02 1234567), se disponibile.
- **Orari**: formato ESATTO `Lun: 9 AM–6 PM | Mar: 9 AM–6 PM | Mer: Closed | ...` — usa le abbreviazioni italiane Lun/Mar/Mer/Gio/Ven/Sab/Dom separate da " | ", orario in formato 12h con AM/PM, oppure scrivi "Closed" se chiuso quel giorno. Se non conosci gli orari, lascia vuoto.
- **Affollamento**: lascia SEMPRE vuoto, questo campo lo gestiamo a parte.

Importante:
- Non inventare dati che non conosci (indirizzo, coordinate, orari, rating) — se non sei sicuro, lascia la cella vuota piuttosto che inventare un valore plausibile ma falso.
- Un posto per riga.
- Se ti do una lista di nomi di locali, cerca informazioni reali su ciascuno prima di compilare la tabella.

Aspetta che ti indichi i posti da aggiungere (o chiedimi di proportene alcuni
in una zona/categoria specifica) prima di generare la tabella.
