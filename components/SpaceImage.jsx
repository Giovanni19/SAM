"use client";

import { useState } from "react";

/**
 * Foto di uno spazio, con degrado pulito se l'immagine non carica.
 *
 * Le foto arrivano da URL esterni (Google Maps, siti delle biblioteche, siti
 * dei locali) che nel tempo scadono o vengono rimossi: senza questo componente
 * il browser mostra l'icona di immagine rotta al posto della foto. Qui invece
 * l'immagine che fallisce sparisce e, dove previsto, lascia il posto al
 * fallback grafico (emoji + gradiente) già usato per gli spazi senza foto.
 *
 * @param {string|null} src              URL della foto (space.image)
 * @param {string} alt                   Testo alternativo
 * @param {string} className             Classi dell'<img>
 * @param {string} [wrapperClassName]    Se presente, l'<img> viene avvolta in un
 *                                       <div> con queste classi: sparisce insieme
 *                                       alla foto quando non c'è o non carica.
 * @param {React.ReactNode} [fallback]   Cosa mostrare al posto della foto.
 */
export default function SpaceImage({
  src,
  alt,
  className,
  wrapperClassName,
  fallback = null,
  ...imgProps
}) {
  // Memorizziamo l'URL fallito invece di un booleano: così, quando il
  // componente viene riusato per un altro spazio (lista, preview della mappa),
  // il nuovo src riparte pulito senza bisogno di un effect di reset.
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) return fallback;

  const img = (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      // Alcuni host bloccano l'hotlinking guardando il Referer: senza referrer
      // le foto di terze parti hanno più probabilità di caricare.
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
      {...imgProps}
    />
  );

  return wrapperClassName ? <div className={wrapperClassName}>{img}</div> : img;
}
