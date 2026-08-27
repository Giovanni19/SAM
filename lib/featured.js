/**
 * Selezione degli "spazi in evidenza" mostrati sulla home e su SAM for Work.
 *
 * Prima erano semplicemente i primi sei in ordine alfabetico, il che metteva in
 * vetrina tre biblioteche di periferia consecutive e un locale da ★3,3.
 *
 * Il criterio ora combina tre cose, con un'avvertenza sul peso del voto: le
 * recensioni di Google valutano IL POSTO, non quanto ci si studi bene. Il
 * Memoriale della Shoah ha ★4,7 su 2.744 voti come memoriale, Un Posto a Milano
 * ★4,0 come ristorante. Per questo il punteggio di studio — che nasce dai dati
 * raccolti a mano per SAM — pesa più del voto, e i posti senza voto (36 su 110,
 * quasi tutte biblioteche comunali) non vengono penalizzati.
 */

/** Punti per ogni caratteristica che rende un posto adatto allo studio. */
const PUNTI = {
  wifi: { confermato: 2, "non verificato": 0 },
  prese: { abbondanti: 2, alcune: 1, "non verificato": 0 },
  sedute: { "tavoli grandi": 2, ok: 1 },
  rumore: { quiet: 2, moderate: 1, lively: 0 },
  stayPolicy: { free: 2, min_order: 1, paid_pass: 0 },
};

/**
 * Quanto un posto è adatto a studiarci, da 0 a 10.
 *
 * `campi` permette di escludere criteri che in una sezione non hanno senso:
 * su SAM for Work la permanenza è a pagamento per definizione, quindi contarla
 * come difetto schiaccerebbe tutti i coworking allo stesso punteggio basso.
 */
export function punteggioStudio(space, campi = Object.keys(PUNTI)) {
  return campi.reduce((n, campo) => n + (PUNTI[campo]?.[space[campo]] ?? 0), 0);
}

/**
 * Voto "corretto": una media bayesiana che tira il voto verso la media generale
 * in proporzione a quanto poco è votato il posto. Senza, un 5,0 con tre
 * recensioni scavalcherebbe un 4,6 con cinquecento.
 */
function votoCorretto(space, mediaGlobale) {
  const PESO = 50; // recensioni "virtuali": sotto questa soglia il voto conta meno
  if (!space.rating || !space.reviewsCount) {
    // Chi non ha voti non deve né guadagnarci né essere escluso: sta appena
    // sotto la media, così il punteggio di studio resta il fattore decisivo.
    return mediaGlobale - 0.3;
  }
  return (space.reviewsCount * space.rating + PESO * mediaGlobale) / (space.reviewsCount + PESO);
}

/** Una scheda con foto, descrizione e orari fa una figura migliore in vetrina. */
const completezza = (s) => (s.image ? 1 : 0) + (s.description ? 1 : 0) + (s.hours ? 1 : 0);

/**
 * Chi può stare in vetrina.
 *
 * La vetrina è un invito: "vai qui". Quindi ne restano fuori i posti che il
 * visitatore non può semplicemente raggiungere e usare — le aule studio delle
 * residenze Bocconi hanno il punteggio pieno (gratis, silenziose, tavoli
 * grandi) e finirebbero in cima ogni settimana, ma per entrare serve che un
 * residente firmi all'ingresso. Stessa logica per le chiusure stagionali.
 *
 * Il criterio è la semplice presenza di una nota di accesso: se un posto ha
 * bisogno di un'avvertenza per essere visitato, non è materiale da vetrina.
 * Resta comunque nel catalogo, nella ricerca e sulla mappa.
 *
 * Serve anche la zona: una scheda senza zona in vetrina sembra incompleta, e
 * con il vincolo "una per zona" tutti i posti senza zona si annullerebbero a
 * vicenda come se fossero nello stesso quartiere.
 */
const idoneoPerVetrina = (s) => !s.accessNote && !!s.zone && !!s.image;

/**
 * Parole che aprono il nome ma dicono solo la categoria, non il gestore.
 * Servono a distinguere "Starbucks Garibaldi" e "Starbucks Reserve Roastery"
 * (stessa catena) da "Biblioteca Venezia" e "Biblioteca Zara" (due biblioteche
 * comunali diverse, che possono benissimo stare insieme in vetrina).
 */
const PAROLE_GENERICHE = new Set([
  "biblioteca", "libreria", "caffè", "cafe", "caffe", "bar", "spazio", "casa",
  "cascina", "residenza", "fondazione", "centro", "aula", "la", "il", "un",
  "ostello", "hostel", "coworking", "open", "studio",
]);

/** Nome ridotto a lettere e spazi, per confronti fra nomi simili. */
const nomeNormalizzato = (name) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Due schede che sembrano lo stesso posto non vanno messe insieme, anche
 * quando sono sedi diverse: "Cascina Cuccagna — Un Posto a Milano" e "Un Posto
 * a Milano" sono due indirizzi distinti, ma affiancati in vetrina sembrano un
 * doppione. Il controllo sulla catena non li intercetta perché entrambi i nomi
 * iniziano con una parola generica.
 */
function nomiSovrapposti(a, b) {
  const x = nomeNormalizzato(a);
  const y = nomeNormalizzato(b);
  return x.includes(y) || y.includes(x);
}

/** Identificativo della catena, o null se il nome non ne suggerisce una. */
function marchio(name) {
  const prima = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)[0];
  return !prima || PAROLE_GENERICHE.has(prima) ? null : prima;
}

/** Generatore pseudo-casuale deterministico: stesso seme, stesso risultato. */
function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Numero della settimana ISO: è ciò che fa cambiare la vetrina ogni lunedì. */
export function settimanaIso(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Giovedì della stessa settimana: l'anno ISO è quello che contiene il giovedì.
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const inizioAnno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const settimana = Math.ceil(((d - inizioAnno) / 86400000 + 1) / 7);
  return d.getUTCFullYear() * 100 + settimana;
}

/**
 * Sceglie gli spazi da mettere in evidenza.
 *
 * @param {Array}  spaces        Tutti gli spazi della sezione (home o work).
 * @param {number} count         Quanti mostrarne.
 * @param {number} poolSize      Ampiezza del bacino da cui pescare. Se non
 *                               indicata si adatta alla sezione: un valore
 *                               fisso di 40 su SAM for Work, che ha una
 *                               cinquantina di posti, significherebbe pescare
 *                               da quasi tutto il catalogo e mettere in
 *                               vetrina anche i posti mediocri.
 * @param {number} maxPerZone    Quante schede al massimo dalla stessa zona.
 * @param {number} maxPerType    Quante al massimo dello stesso tipo. Nel bacino
 *                               della home 25 posti su 30 sono biblioteche:
 *                               senza questo vincolo la vetrina sarebbe tutta
 *                               uguale, con un vincolo troppo stretto si
 *                               pescherebbe troppo in basso pur di variare.
 * @param {Date}   date          Data di riferimento (per i test).
 */
export function selezionaInEvidenza(
  spaces,
  { count = 6, poolSize, maxPerZone = 1, maxPerType = 3, campiStudio, date = new Date() } = {}
) {
  if (!spaces?.length) return [];

  const candidati = spaces.filter(idoneoPerVetrina);
  if (!candidati.length) return [];

  const votati = candidati.filter((s) => s.rating && s.reviewsCount);
  const mediaGlobale = votati.length
    ? votati.reduce((n, s) => n + s.rating, 0) / votati.length
    : 4;

  const punteggio = (s) =>
    punteggioStudio(s, campiStudio) + votoCorretto(s, mediaGlobale) * 1.2 + completezza(s) * 0.5;

  // Il bacino è la parte alta della classifica: la rotazione avviene solo qui
  // dentro, così ogni settimana cambia la vetrina ma non il livello.
  // Il bacino è la parte alta della classifica, in proporzione alla sezione:
  // abbastanza ampio da far ruotare la vetrina, abbastanza stretto da non
  // arrivare mai a pescare nella metà debole del catalogo.
  const ampiezza = poolSize ?? Math.min(40, Math.max(count * 3, Math.round(candidati.length * 0.3)));

  const bacino = [...candidati]
    .sort((a, b) => punteggio(b) - punteggio(a) || a.name.localeCompare(b.name, "it"))
    .slice(0, Math.max(count, ampiezza));

  // Mescolata deterministica sul numero di settimana: uguale per tutti i
  // visitatori nell'arco della settimana (quindi la pagina resta cacheabile) e
  // diversa dal lunedì successivo.
  const rnd = random(settimanaIso(date));
  const mescolato = [...bacino];
  for (let i = mescolato.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [mescolato[i], mescolato[j]] = [mescolato[j], mescolato[i]];
  }

  const scelti = [];
  const perZona = {};
  const perTipo = {};
  const marchiUsati = new Set();
  const prendi = (s) => {
    scelti.push(s);
    perZona[s.zone] = (perZona[s.zone] || 0) + 1;
    perTipo[s.types?.[0]] = (perTipo[s.types?.[0]] || 0) + 1;
    const m = marchio(s.name);
    if (m) marchiUsati.add(m);
  };

  for (const s of mescolato) {
    if (scelti.length === count) break;
    if ((perZona[s.zone] || 0) >= maxPerZone) continue;
    if ((perTipo[s.types?.[0]] || 0) >= maxPerType) continue;
    const m = marchio(s.name);
    if (m && marchiUsati.has(m)) continue; // due Starbucks in vetrina fanno brutto
    if (scelti.some((g) => nomiSovrapposti(g.name, s.name))) continue;
    prendi(s);
  }

  // Se i vincoli di varietà non lasciano abbastanza candidati (può succedere su
  // sezioni piccole o molto omogenee) si completa senza vincoli: meglio una
  // vetrina un po' ripetitiva che una vetrina con tre schede.
  if (scelti.length < count) {
    for (const s of mescolato) {
      if (scelti.length === count) break;
      if (!scelti.includes(s)) prendi(s);
    }
  }

  return scelti;
}
