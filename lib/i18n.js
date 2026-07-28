// Internazionalizzazione (IT / EN).
//
// Regola importante: i VALORI canonici restano in italiano ovunque siano
// persistiti o confrontati — tipi di spazio ("Caffetteria"), valori delle
// amenità ("confermato", "abbondanti"), tag dei commenti salvati su Supabase.
// Qui traduciamo solo le ETICHETTE mostrate a schermo, così filtri, query
// string (?type=) e dati già salvati continuano a funzionare in entrambe le
// lingue.
//
// L'italiano è la lingua di default e vive senza prefisso (/spaces);
// l'inglese sta sotto /en (/en/spaces). Vedi middleware.js per il rewrite.

export const LOCALES = ["it", "en"];
export const DEFAULT_LOCALE = "it";

export function isLocale(value) {
  return LOCALES.includes(value);
}

/** Prefissa un percorso interno con la lingua (l'italiano resta senza prefisso). */
export function localeHref(lang, path = "/") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (lang === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${lang}` : `/${lang}${clean}`;
}

/** Rimuove l'eventuale prefisso di lingua da un pathname (→ percorso "neutro"). */
export function stripLocale(pathname = "/") {
  for (const l of LOCALES) {
    if (l === DEFAULT_LOCALE) continue;
    if (pathname === `/${l}`) return "/";
    if (pathname.startsWith(`/${l}/`)) return pathname.slice(l.length + 1);
  }
  return pathname || "/";
}

/** Lingua dedotta da un pathname (default: italiano). */
export function localeFromPath(pathname = "/") {
  for (const l of LOCALES) {
    if (l === DEFAULT_LOCALE) continue;
    if (pathname === `/${l}` || pathname.startsWith(`/${l}/`)) return l;
  }
  return DEFAULT_LOCALE;
}

/* ------------------------------- Dizionari -------------------------------- */

const it = {
  locale: "it",
  htmlLang: "it",
  dateLocale: "it-IT",

  brand: {
    sam: "SAM",
    samFull: "Study Areas Milan",
    work: "SAM for Work",
  },

  nav: {
    spaces: "Spazi",
    map: "Mappa",
    favorites: "♥ Preferiti",
    login: "Accedi",
    signup: "Registrati",
    account: "Il tuo account",
    logout: "Esci",
    menu: "Menu",
    switchLanguage: "Passa all'inglese",
  },

  home: {
    eyebrow: "Study Areas Milan",
    title: "Trova il posto giusto per studiare a Milano",
    subtitle: (n) =>
      `${n} spazi selezionati — caffetterie, biblioteche e librerie — con WiFi, prese e info su rumore e permanenza.`,
    explore: "Esplora gli spazi",
    viewMap: "Vedi sulla mappa",
    crossCta: "💼 Cerchi un coworking? Prova SAM for Work →",
    featured: "Spazi in evidenza",
    featuredMeta: (n, z) => `${n} spazi in ${z} zone di Milano`,
    viewAll: "Vedi tutti →",
  },

  work: {
    eyebrow: "SAM for Work",
    title: "Trova il posto giusto per lavorare a Milano",
    subtitle: (n) =>
      `${n} coworking selezionati — day pass, sale riunioni e WiFi veloce per lavoratori e team commerciali.`,
    explore: "Esplora i coworking",
    viewMap: "Vedi sulla mappa",
    crossCta: "📚 Cerchi un posto per studiare? Prova SAM →",
    featured: "Coworking in evidenza",
    featuredMeta: (n, z) => `${n} coworking in ${z} zone di Milano`,
    viewAll: "Vedi tutti →",
    metaTitle: "SAM for Work — Coworking a Milano",
    metaDescription:
      "Gli spazi di coworking di Milano selezionati da SAM: day pass, sale riunioni e WiFi veloce per lavoratori e team commerciali.",
  },

  spaces: {
    allTitle: "Tutti gli spazi",
    allMeta: (n) => `${n} spazi dove studiare a Milano`,
    metaTitle: "Tutti gli spazi — SAM",
    metaDescription:
      "Tutte le caffetterie, biblioteche e librerie di Milano dove studiare, con WiFi, prese e rumore verificati.",
    workTitle: "Tutti i coworking",
    workMeta: (n) => `${n} coworking dove lavorare a Milano`,
    workMetaTitle: "Tutti i coworking — SAM for Work",
    workMetaDescription:
      "Tutti gli spazi di coworking di Milano con day pass, WiFi veloce e sale riunioni, selezionati da SAM for Work.",
  },

  search: {
    queryLabel: "Cerca un posto",
    queryPlaceholder: "Nome del posto (es. Biblioteca Sormani)…",
    zone: "Zona",
    allZones: "Tutte le zone",
    type: "Tipo di spazio",
    allTypes: "Tutti i tipi",
    any: "Indifferente",
    submit: "🔍 Cerca",
    reset: "Reset",
    openNow: "Aperti adesso",
  },

  results: {
    count: (n) => `${n} ${n === 1 ? "spazio" : "spazi"}`,
    openNow: "aperti adesso",
    emptyTitle: "Nessuno spazio trovato",
    emptyHint: "Prova a modificare i filtri di ricerca.",
  },

  detail: {
    backSpaces: "← Tutti gli spazi",
    backCoworking: "← Tutti i coworking",
    description: "Descrizione",
    amenitiesStudy: "Com'è per studiare",
    amenitiesWork: "Com'è per lavorare",
    crowding: "Affollamento",
    noCrowding: "Dati affluenza non disponibili.",
    info: "Informazioni",
    type: "Tipo",
    zone: "Zona",
    address: "Indirizzo",
    phone: "Telefono",
    hours: "Orari",
    book: "📅 Prenota il tuo posto",
    openMaps: "Apri in Google Maps",
    website: "Sito web",
    warning: "Attenzione: ",
    booking: "Prenotazione: ",
    ratingTitle: "Valutazione e recensioni da Google Maps",
    share: "Condividi",
    linkCopied: "Link copiato!",
    copyManually: "Copia il link a mano:",
    addFavorite: "Aggiungi ai preferiti",
    removeFavorite: "Rimuovi dai preferiti",
  },

  openStatus: {
    openUntil: (t) => `Aperto · chiude alle ${t}`,
    open: "Aperto ora",
    closed: "Chiuso ora",
    unknown: "Orari non disponibili",
  },

  days: { mon: "Lun", tue: "Mar", wed: "Mer", thu: "Gio", fri: "Ven", sat: "Sab", sun: "Dom" },

  types: {
    Caffetteria: "Caffetteria",
    Biblioteca: "Biblioteca",
    Coworking: "Coworking",
    Libreria: "Libreria",
    Altro: "Altro",
  },

  amenities: {
    groups: {
      wifi: "WiFi",
      prese: "Prese",
      sedute: "Sedute",
      rumore: "Rumore",
      stay: "Permanenza",
      ac: "Aria condizionata",
    },
    wifi: {
      confermato: "WiFi confermato",
      probabile: "WiFi probabile",
      "non verificato": "WiFi non verificato",
      assente: "WiFi assente",
    },
    prese: {
      abbondanti: "Prese abbondanti",
      alcune: "Alcune prese",
      assenti: "Niente prese",
      "non verificato": "Prese non verificate",
    },
    sedute: {
      "tavoli grandi": "Tavoli grandi",
      ok: "Sedute comode",
      sgabelli: "Solo sgabelli",
    },
    rumore: {
      quiet: "Silenzioso",
      moderate: "Rumore moderato",
      lively: "Vivace / rumoroso",
    },
    stay: {
      free: "Puoi restare liberamente",
      min_order: "Serve una consumazione",
      paid_pass: "Ingresso a pagamento",
    },
    ac: {
      presente: "Aria condizionata",
      "non verificato": "Aria condizionata non verificata",
      assente: "Niente aria condizionata",
    },
  },

  map: {
    title: "Mappa",
    metaTitleSam: "Mappa — SAM",
    metaDescriptionSam: "Tutti gli spazi studio di Milano sulla mappa, con la tua posizione.",
    metaTitleWork: "Mappa coworking — SAM for Work",
    metaDescriptionWork: "I coworking di Milano sulla mappa, con la tua posizione.",
    countSam: (n) => `${n} spazi sulla mappa · attiva la posizione per trovare i più vicini`,
    countWork: (n) => `${n} coworking sulla mappa · attiva la posizione per trovare i più vicini`,
    loading: "Caricamento mappa…",
    locating: "Individuo…",
    myPosition: "📍 La mia posizione",
    useMyPosition: "📍 Usa la mia posizione",
    nearbyTitle: "Trova i posti vicini",
    nearbyHint:
      "Tocca un pin per l'anteprima, oppure attiva la posizione per vedere i posti più vicini ordinati per distanza.",
    nearestTitle: "Più vicini a te",
    denied: "Permesso negato. Attivalo dalle impostazioni del browser per vedere i posti vicini.",
    error: "Impossibile ottenere la posizione. Riprova.",
    closePreview: "Chiudi anteprima",
    viewDetails: "Vedi dettagli",
    ratingTitle: "Valutazione Google Maps",
  },

  comments: {
    title: "Commenti",
    placeholder: "Com'è andata la tua sessione di studio qui?",
    anonymous: "Commenta in modo anonimo",
    publish: "Pubblica commento",
    publishing: "Pubblicazione…",
    loading: "Caricamento commenti…",
    empty: "Ancora nessun commento: scrivi il primo.",
    edit: "Modifica",
    delete: "Elimina",
    report: "Segnala",
    reported: "Segnalato",
    cancel: "Annulla",
    save: "Salva modifiche",
    saving: "Salvataggio…",
    editedSuffix: " · modificato",
    anonName: "🕶️ Anonimo",
    postError: "Non è stato possibile pubblicare il commento. Riprova.",
    myTitle: "I tuoi commenti",
    mySubtitle: "Tutti i commenti che hai lasciato sugli spazi.",
    myMetaTitle: "I tuoi commenti — SAM",
    groups: {
      pulizia: "Pulizia",
      bagno: "Bagno",
      wifi: "WiFi",
      prese: "Prese",
      rumore: "Rumore",
      posti: "Posti a sedere",
      personale: "Personale",
      prezzi: "Prezzi",
      accessibilita: "Accessibilità",
    },
    // Etichette allineate ai valori canonici in COMMENT_FEEDBACK (utils.js).
    options: {
      "🧼 Ambiente pulito": "🧼 Ambiente pulito",
      "😐 Ambiente nella media": "😐 Ambiente nella media",
      "🧹 Poco pulito": "🧹 Poco pulito",
      "🚻 Bagno pulito": "🚻 Bagno pulito",
      "😐 Bagno nella media": "😐 Bagno nella media",
      "🚽 Bagno sporco": "🚽 Bagno sporco",
      "📶 WiFi veloce": "📶 WiFi veloce",
      "😐 WiFi nella media": "😐 WiFi nella media",
      "📵 WiFi lento o assente": "📵 WiFi lento o assente",
      "🔌 Tante prese": "🔌 Tante prese",
      "😐 Prese sufficienti": "😐 Prese sufficienti",
      "🪫 Poche prese": "🪫 Poche prese",
      "🤫 Tranquillo per concentrarsi": "🤫 Tranquillo per concentrarsi",
      "😐 Rumore nella media": "😐 Rumore nella media",
      "🔊 Troppo rumoroso": "🔊 Troppo rumoroso",
      "🪑 Posti comodi": "🪑 Posti comodi",
      "😐 Posti nella media": "😐 Posti nella media",
      "🥴 Posti scomodi": "🥴 Posti scomodi",
      "😊 Personale gentile": "😊 Personale gentile",
      "😐 Personale nella media": "😐 Personale nella media",
      "😒 Personale scortese": "😒 Personale scortese",
      "💰 Prezzi onesti": "💰 Prezzi onesti",
      "😐 Prezzi nella media": "😐 Prezzi nella media",
      "💸 Prezzi alti": "💸 Prezzi alti",
      "♿ Accessibile in carrozzina": "♿ Accessibile in carrozzina",
      "😐 Accessibilità nella media": "😐 Accessibilità nella media",
      "🚫 Non accessibile": "🚫 Non accessibile",
    },
  },

  favorites: {
    title: "I tuoi preferiti",
    subtitleSam: "Gli spazi che hai salvato, disponibili solo su questo dispositivo.",
    subtitleWork: "I coworking che hai salvato, disponibili solo su questo dispositivo.",
    metaTitleSam: "I tuoi preferiti — SAM",
    metaTitleWork: "I tuoi coworking preferiti — SAM for Work",
    loading: "Caricamento…",
    emptyTitle: "Nessun preferito ancora",
    emptyHint: "Tocca il cuore su uno spazio per salvarlo qui.",
    explore: "Esplora gli spazi",
  },

  authPrompt: {
    filters: "Accedi o registrati per usare i filtri",
    favorite: "Accedi o registrati per salvarlo nei tuoi preferiti",
    comment: "Accedi o registrati per lasciare un commento",
    report: "Accedi per segnalare un commento",
    like: "Accedi per mettere like a un commento",
    close: "Chiudi",
  },

  auth: {
    loginTitle: "Accedi",
    loginSubtitle: "Bentornato su SAM. Accedi per ritrovare i tuoi preferiti ovunque.",
    email: "Email",
    password: "Password",
    waiting: "Attendere…",
    forgot: "Ho dimenticato la mia password",
    or: "oppure",
    magicTitle: "Accedi senza password",
    magicHint: "Ti inviamo un link magico via email: clicchi e sei dentro.",
    magicSend: "✉️ Inviami il link",
    noAccount: "Non hai un account?",
    haveAccount: "Hai già un account?",
    missingCredentials: "Inserisci email e password.",
    errInvalid: "Email o password non corretti.",
    errUnconfirmed: "Devi confermare l'email prima di accedere.",
    errRateLimit: "Troppi tentativi, riprova tra poco.",
    errGeneric: "Si è verificato un errore. Riprova.",

    signupTitle: "Crea il tuo account",
    signupSubtitle: "Salva i tuoi posti preferiti e ritrovali su ogni dispositivo.",
    firstName: "Nome",
    lastName: "Cognome",
    minChars: "Almeno 6 caratteri.",
    createAccount: "Crea account",
    profilingTitle: "Aiutaci a capire chi usa SAM (facoltativo)",
    privacyDetails: "Dettagli nell'informativa",
    occupation: "Cosa fai?",
    university: "Università",
    selectPlaceholder: "Seleziona…",
    age: "Età",
    agePreferNot: "Preferisco non dirlo",
    ageSuffix: "anni",
    acceptPrivacyPre: "Ho letto e accetto l'",
    acceptPrivacyLink: "Informativa privacy",
    acceptPrivacyPost: "e ho almeno 16 anni.",

    forgotTitle: "Password dimenticata",
    forgotSubtitle: "Inserisci la tua email: ti invieremo un link per crearne una nuova.",
    forgotMissing: "Inserisci la tua email.",
    forgotSent:
      "Se esiste un account con questa email, ti abbiamo inviato un link per reimpostare la password.",
    forgotSend: "Inviami il link",
    rememberedPassword: "Ti sei ricordato la password?",
    backToLogin: "Torna all'accesso",

    resetTitle: "Scegli una nuova password",
    resetSubtitle: "Inserisci la password che vuoi usare d'ora in poi.",
    newPassword: "Nuova password",
    confirmPassword: "Conferma password",
    resetTooShort: "La password deve avere almeno 6 caratteri.",
    resetMismatch: "Le due password non coincidono.",
    resetExpired: "Il link potrebbe essere scaduto. Richiedine uno nuovo.",
    resetSave: "Salva nuova password",
    resetDoneTitle: "Password aggiornata",
    resetDoneText: "La tua password è stata cambiata con successo.",
    resetGoAccount: "Vai al tuo account",
  },

  account: {
    greeting: (name) => `Ciao, ${name}`,
    subtitle: "Visualizza e modifica i tuoi dati.",
    metaTitle: "Il tuo account — SAM",
    myFavorites: "♥ I miei preferiti",
    myComments: "💬 I miei commenti",
  },

  footer: {
    taglineSam: "Study Areas Milan — trova il posto giusto per studiare in città.",
    taglineWork: "SAM for Work — i coworking di Milano per lavorare e per i team commerciali.",
    explore: "Esplora",
    allSpaces: "Tutti gli spazi",
    allCoworking: "Tutti i coworking",
    map: "Mappa",
    favorites: "Preferiti",
    types: "Tipi",
    cafes: "Caffetterie",
    libraries: "Biblioteche",
    bookshops: "Librerie",
    coworkingLink: "💼 Coworking → SAM for Work",
    lookingElse: "Cerchi altro?",
    samLink: "📚 Vai a SAM (studio)",
    contact: "Contatti & Legale",
    city: "Milano, Italia",
    privacy: "Informativa privacy",
    cookie: "Cookie policy",
    privacyShort: "Privacy",
    cookieShort: "Cookie",
    madeWith: "Fatto con ♥ a Milano",
  },

  cookieBanner: {
    text: "Usiamo cookie tecnici necessari e, solo con il tuo consenso, cookie di analisi per capire come viene usato il sito.",
    more: "Scopri di più",
    reject: "Rifiuta",
    accept: "Accetta",
  },

  legal: {
    // Privacy e cookie policy restano in italiano: sono testi con valore
    // legale e vanno validati da un legale prima di pubblicarne una versione
    // tradotta (vedi nota in app/[lang]/privacy/page.js).
    onlyItalianNotice:
      "This is a legal document and is available in Italian only. If you need help understanding it, write to info@studyareasmilan.it.",
  },
};

const en = {
  locale: "en",
  htmlLang: "en",
  dateLocale: "en-GB",

  brand: {
    sam: "SAM",
    samFull: "Study Areas Milan",
    work: "SAM for Work",
  },

  nav: {
    spaces: "Spaces",
    map: "Map",
    favorites: "♥ Favourites",
    login: "Sign in",
    signup: "Sign up",
    account: "Your account",
    logout: "Sign out",
    menu: "Menu",
    switchLanguage: "Switch to Italian",
  },

  home: {
    eyebrow: "Study Areas Milan",
    title: "Find the right place to study in Milan",
    subtitle: (n) =>
      `${n} hand-picked places — cafés, libraries and bookshops — with WiFi, power sockets and notes on noise and how long you can stay.`,
    explore: "Explore spaces",
    viewMap: "View on the map",
    crossCta: "💼 Looking for a coworking space? Try SAM for Work →",
    featured: "Featured spaces",
    featuredMeta: (n, z) => `${n} places across ${z} areas of Milan`,
    viewAll: "View all →",
  },

  work: {
    eyebrow: "SAM for Work",
    title: "Find the right place to work in Milan",
    subtitle: (n) =>
      `${n} hand-picked coworking spaces — day passes, meeting rooms and fast WiFi for remote workers and sales teams.`,
    explore: "Explore coworking spaces",
    viewMap: "View on the map",
    crossCta: "📚 Looking for a place to study? Try SAM →",
    featured: "Featured coworking spaces",
    featuredMeta: (n, z) => `${n} coworking spaces across ${z} areas of Milan`,
    viewAll: "View all →",
    metaTitle: "SAM for Work — Coworking in Milan",
    metaDescription:
      "Milan's coworking spaces hand-picked by SAM: day passes, meeting rooms and fast WiFi for remote workers and sales teams.",
  },

  spaces: {
    allTitle: "All spaces",
    allMeta: (n) => `${n} places to study in Milan`,
    metaTitle: "All spaces — SAM",
    metaDescription:
      "Every café, library and bookshop in Milan where you can study, with verified WiFi, power sockets and noise levels.",
    workTitle: "All coworking spaces",
    workMeta: (n) => `${n} coworking spaces to work from in Milan`,
    workMetaTitle: "All coworking spaces — SAM for Work",
    workMetaDescription:
      "Every coworking space in Milan with day passes, fast WiFi and meeting rooms, hand-picked by SAM for Work.",
  },

  search: {
    queryLabel: "Search for a place",
    queryPlaceholder: "Place name (e.g. Biblioteca Sormani)…",
    zone: "Area",
    allZones: "All areas",
    type: "Space type",
    allTypes: "All types",
    any: "Any",
    submit: "🔍 Search",
    reset: "Reset",
    openNow: "Open now",
  },

  results: {
    count: (n) => `${n} ${n === 1 ? "place" : "places"}`,
    openNow: "open now",
    emptyTitle: "No places found",
    emptyHint: "Try adjusting your search filters.",
  },

  detail: {
    backSpaces: "← All spaces",
    backCoworking: "← All coworking spaces",
    description: "Description",
    amenitiesStudy: "What it's like to study here",
    amenitiesWork: "What it's like to work here",
    crowding: "How busy it gets",
    noCrowding: "No footfall data available.",
    info: "Details",
    type: "Type",
    zone: "Area",
    address: "Address",
    phone: "Phone",
    hours: "Opening hours",
    book: "📅 Book your spot",
    openMaps: "Open in Google Maps",
    website: "Website",
    warning: "Heads up: ",
    booking: "Booking: ",
    ratingTitle: "Rating and reviews from Google Maps",
    share: "Share",
    linkCopied: "Link copied!",
    copyManually: "Copy the link manually:",
    addFavorite: "Add to favourites",
    removeFavorite: "Remove from favourites",
  },

  openStatus: {
    openUntil: (t) => `Open · closes at ${t}`,
    open: "Open now",
    closed: "Closed now",
    unknown: "Opening hours unavailable",
  },

  days: { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" },

  types: {
    Caffetteria: "Café",
    Biblioteca: "Library",
    Coworking: "Coworking",
    Libreria: "Bookshop",
    Altro: "Other",
  },

  amenities: {
    groups: {
      wifi: "WiFi",
      prese: "Power sockets",
      sedute: "Seating",
      rumore: "Noise",
      stay: "How long you can stay",
      ac: "Air conditioning",
    },
    wifi: {
      confermato: "WiFi confirmed",
      probabile: "WiFi likely",
      "non verificato": "WiFi unverified",
      assente: "No WiFi",
    },
    prese: {
      abbondanti: "Plenty of sockets",
      alcune: "Some sockets",
      assenti: "No sockets",
      "non verificato": "Sockets unverified",
    },
    sedute: {
      "tavoli grandi": "Large tables",
      ok: "Comfortable seating",
      sgabelli: "Stools only",
    },
    rumore: {
      quiet: "Quiet",
      moderate: "Moderate noise",
      lively: "Lively / noisy",
    },
    stay: {
      free: "Stay as long as you like",
      min_order: "Minimum order required",
      paid_pass: "Paid entry",
    },
    ac: {
      presente: "Air conditioning",
      "non verificato": "Air conditioning unverified",
      assente: "No air conditioning",
    },
  },

  map: {
    title: "Map",
    metaTitleSam: "Map — SAM",
    metaDescriptionSam: "Every study space in Milan on the map, with your location.",
    metaTitleWork: "Coworking map — SAM for Work",
    metaDescriptionWork: "Milan's coworking spaces on the map, with your location.",
    countSam: (n) => `${n} places on the map · turn on location to find the closest ones`,
    countWork: (n) => `${n} coworking spaces on the map · turn on location to find the closest ones`,
    loading: "Loading map…",
    locating: "Locating…",
    myPosition: "📍 My location",
    useMyPosition: "📍 Use my location",
    nearbyTitle: "Find places near you",
    nearbyHint:
      "Tap a pin for a preview, or turn on location to see the closest places sorted by distance.",
    nearestTitle: "Closest to you",
    denied: "Permission denied. Enable it in your browser settings to see nearby places.",
    error: "Couldn't get your location. Please try again.",
    closePreview: "Close preview",
    viewDetails: "View details",
    ratingTitle: "Google Maps rating",
  },

  comments: {
    title: "Comments",
    placeholder: "How was your study session here?",
    anonymous: "Comment anonymously",
    publish: "Post comment",
    publishing: "Posting…",
    loading: "Loading comments…",
    empty: "No comments yet — be the first to write one.",
    edit: "Edit",
    delete: "Delete",
    report: "Report",
    reported: "Reported",
    cancel: "Cancel",
    save: "Save changes",
    saving: "Saving…",
    editedSuffix: " · edited",
    anonName: "🕶️ Anonymous",
    postError: "We couldn't post your comment. Please try again.",
    myTitle: "Your comments",
    mySubtitle: "Every comment you've left on a space.",
    myMetaTitle: "Your comments — SAM",
    groups: {
      pulizia: "Cleanliness",
      bagno: "Toilets",
      wifi: "WiFi",
      prese: "Power sockets",
      rumore: "Noise",
      posti: "Seating",
      personale: "Staff",
      prezzi: "Prices",
      accessibilita: "Accessibility",
    },
    // Chiavi = valori canonici salvati su Supabase, valori = etichetta inglese.
    options: {
      "🧼 Ambiente pulito": "🧼 Clean space",
      "😐 Ambiente nella media": "😐 Average cleanliness",
      "🧹 Poco pulito": "🧹 Not very clean",
      "🚻 Bagno pulito": "🚻 Clean toilets",
      "😐 Bagno nella media": "😐 Average toilets",
      "🚽 Bagno sporco": "🚽 Dirty toilets",
      "📶 WiFi veloce": "📶 Fast WiFi",
      "😐 WiFi nella media": "😐 Average WiFi",
      "📵 WiFi lento o assente": "📵 Slow or no WiFi",
      "🔌 Tante prese": "🔌 Plenty of sockets",
      "😐 Prese sufficienti": "😐 Enough sockets",
      "🪫 Poche prese": "🪫 Few sockets",
      "🤫 Tranquillo per concentrarsi": "🤫 Quiet enough to focus",
      "😐 Rumore nella media": "😐 Average noise",
      "🔊 Troppo rumoroso": "🔊 Too noisy",
      "🪑 Posti comodi": "🪑 Comfortable seats",
      "😐 Posti nella media": "😐 Average seats",
      "🥴 Posti scomodi": "🥴 Uncomfortable seats",
      "😊 Personale gentile": "😊 Friendly staff",
      "😐 Personale nella media": "😐 Average staff",
      "😒 Personale scortese": "😒 Unfriendly staff",
      "💰 Prezzi onesti": "💰 Fair prices",
      "😐 Prezzi nella media": "😐 Average prices",
      "💸 Prezzi alti": "💸 Expensive",
      "♿ Accessibile in carrozzina": "♿ Wheelchair accessible",
      "😐 Accessibilità nella media": "😐 Partly accessible",
      "🚫 Non accessibile": "🚫 Not accessible",
    },
  },

  favorites: {
    title: "Your favourites",
    subtitleSam: "The places you've saved, available on this device only.",
    subtitleWork: "The coworking spaces you've saved, available on this device only.",
    metaTitleSam: "Your favourites — SAM",
    metaTitleWork: "Your favourite coworking spaces — SAM for Work",
    loading: "Loading…",
    emptyTitle: "No favourites yet",
    emptyHint: "Tap the heart on a space to save it here.",
    explore: "Explore spaces",
  },

  authPrompt: {
    filters: "Sign in or create an account to use the filters",
    favorite: "Sign in or create an account to save it to your favourites",
    comment: "Sign in or create an account to leave a comment",
    report: "Sign in to report a comment",
    like: "Sign in to like a comment",
    close: "Close",
  },

  auth: {
    loginTitle: "Sign in",
    loginSubtitle: "Welcome back to SAM. Sign in to find your favourites anywhere.",
    email: "Email",
    password: "Password",
    waiting: "Please wait…",
    forgot: "I forgot my password",
    or: "or",
    magicTitle: "Sign in without a password",
    magicHint: "We'll email you a magic link: click it and you're in.",
    magicSend: "✉️ Send me the link",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    missingCredentials: "Enter your email and password.",
    errInvalid: "Incorrect email or password.",
    errUnconfirmed: "You need to confirm your email before signing in.",
    errRateLimit: "Too many attempts, please try again shortly.",
    errGeneric: "Something went wrong. Please try again.",

    signupTitle: "Create your account",
    signupSubtitle: "Save your favourite places and find them on any device.",
    firstName: "First name",
    lastName: "Last name",
    minChars: "At least 6 characters.",
    createAccount: "Create account",
    profilingTitle: "Help us understand who uses SAM (optional)",
    privacyDetails: "Details in the privacy policy",
    occupation: "What do you do?",
    university: "University",
    selectPlaceholder: "Select…",
    age: "Age",
    agePreferNot: "I'd rather not say",
    ageSuffix: "years old",
    acceptPrivacyPre: "I have read and accept the ",
    acceptPrivacyLink: "Privacy policy",
    acceptPrivacyPost: "and I am at least 16 years old.",

    forgotTitle: "Forgotten password",
    forgotSubtitle: "Enter your email and we'll send you a link to create a new one.",
    forgotMissing: "Enter your email.",
    forgotSent: "If an account exists for this email, we've sent you a link to reset your password.",
    forgotSend: "Send me the link",
    rememberedPassword: "Remembered your password?",
    backToLogin: "Back to sign in",

    resetTitle: "Choose a new password",
    resetSubtitle: "Enter the password you'd like to use from now on.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    resetTooShort: "Your password must be at least 6 characters.",
    resetMismatch: "The two passwords don't match.",
    resetExpired: "The link may have expired. Request a new one.",
    resetSave: "Save new password",
    resetDoneTitle: "Password updated",
    resetDoneText: "Your password has been changed successfully.",
    resetGoAccount: "Go to your account",
  },

  account: {
    greeting: (name) => `Hi, ${name}`,
    subtitle: "View and edit your details.",
    metaTitle: "Your account — SAM",
    myFavorites: "♥ My favourites",
    myComments: "💬 My comments",
  },

  footer: {
    taglineSam: "Study Areas Milan — find the right place to study in the city.",
    taglineWork: "SAM for Work — Milan's coworking spaces for remote work and sales teams.",
    explore: "Explore",
    allSpaces: "All spaces",
    allCoworking: "All coworking spaces",
    map: "Map",
    favorites: "Favourites",
    types: "Types",
    cafes: "Cafés",
    libraries: "Libraries",
    bookshops: "Bookshops",
    coworkingLink: "💼 Coworking → SAM for Work",
    lookingElse: "Looking for something else?",
    samLink: "📚 Go to SAM (study)",
    contact: "Contact & Legal",
    city: "Milan, Italy",
    privacy: "Privacy policy",
    cookie: "Cookie policy",
    privacyShort: "Privacy",
    cookieShort: "Cookies",
    madeWith: "Made with ♥ in Milan",
  },

  cookieBanner: {
    text: "We use necessary technical cookies and, only with your consent, analytics cookies to understand how the site is used.",
    more: "Learn more",
    reject: "Reject",
    accept: "Accept",
  },

  legal: {
    onlyItalianNotice:
      "This is a legal document and is available in Italian only. If you need help understanding it, write to info@studyareasmilan.it.",
  },
};

const DICTIONARIES = { it, en };

export function getDictionary(lang) {
  return DICTIONARIES[lang] || DICTIONARIES[DEFAULT_LOCALE];
}
