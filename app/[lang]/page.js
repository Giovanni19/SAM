import { getStudySpaces } from "@/lib/places";
import { LOCALES } from "@/lib/i18n";
import { selezionaInEvidenza } from "@/lib/featured";
import HomeMap from "@/components/home/HomeMap";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

// Gli spazi in evidenza (in cima alla lista finché non si sceglie un campus)
// cambiano ogni lunedì: senza rigenerazione la home resterebbe ferma alla
// vetrina del giorno del build.
export const revalidate = 3600;

export default async function HomePage() {
  // La home di SAM esclude i coworking "puri" (che vivono in SAM for Work).
  const spaces = (await getStudySpaces()).filter((s) => s.lat != null && s.lng != null);
  const featuredIds = selezionaInEvidenza(spaces).map((s) => s.id);

  return <HomeMap spaces={spaces} featuredIds={featuredIds} />;
}
