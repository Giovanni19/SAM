import { notFound, redirect } from "next/navigation";
import { getSpaceById, getSpaces } from "@/lib/notion";
import { isStudySpace, displayType, spaceMetaDescription } from "@/lib/utils";
import { getDictionary, localeHref, LOCALES } from "@/lib/i18n";
import SpaceDetail from "@/components/SpaceDetail";

const BASE_URL = "https://www.studyareasmilan.it";
// Assoluto di proposito: Next non risolve le immagini OG relative col
// metadataBase del layout, e in produzione finirebbero sull'URL di deploy
// invece che sul dominio del sito (canonical e og:url invece lo ereditano).
const FALLBACK_OG_IMAGE = `${BASE_URL}/opengraph-image`;

export async function generateStaticParams() {
  const spaces = await getSpaces();
  // SAM non mostra i coworking puri: i loro dettagli vivono sotto /work/spaces.
  // Ogni spazio va generato una volta per lingua.
  return spaces
    .filter(isStudySpace)
    .flatMap((s) => LOCALES.map((lang) => ({ lang, id: s.id })));
}

export async function generateMetadata({ params }) {
  const { lang } = params;
  const t = getDictionary(lang);
  const space = await getSpaceById(params.id);
  if (!space) return { title: lang === "en" ? "Space not found — SAM" : "Spazio non trovato — SAM" };

  const withType = { ...space, type: displayType(space, "study") };
  const title = `${space.name} — SAM`;
  const description = spaceMetaDescription(withType, t);
  const path = `/spaces/${space.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: localeHref(lang, path),
      languages: { it: path, en: `/en${path}`, "x-default": path },
    },
    openGraph: {
      title,
      description,
      url: localeHref(lang, path),
      type: "website",
      // Next.js non eredita l'opengraph-image.js del layout quando la pagina
      // definisce il proprio `openGraph`: serve un fallback esplicito.
      images: [space.image || FALLBACK_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [space.image || FALLBACK_OG_IMAGE],
    },
  };
}

export default async function SpaceDetailPage({ params }) {
  const { lang } = params;
  const space = await getSpaceById(params.id);
  if (!space) notFound();
  // I coworking puri appartengono a SAM for Work: reindirizza, così i vecchi
  // link continuano a funzionare. I posti con più categorie restano qui.
  if (!isStudySpace(space)) redirect(localeHref(lang, `/work/spaces/${space.id}`));

  return (
    <SpaceDetail
      space={{ ...space, type: displayType(space, "study") }}
      lang={lang}
      backHref="/spaces"
      section="study"
    />
  );
}
