import { permanentRedirect } from "next/navigation";
import { localeHref } from "@/lib/i18n";

// La mappa di SAM ora è la home: il vecchio indirizzo resta valido per chi
// l'aveva salvato o lo trova su Google, e rimanda lì.
export default function MapPage({ params }) {
  permanentRedirect(localeHref(params.lang, "/"));
}
