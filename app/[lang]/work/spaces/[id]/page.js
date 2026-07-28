import { notFound, redirect } from "next/navigation";
import { getSpaceById, getSpaces } from "@/lib/notion";
import { isCoworking, displayType, spaceMetaDescription } from "@/lib/utils";
import { getDictionary, localeHref, LOCALES } from "@/lib/i18n";
import SpaceDetail from "@/components/SpaceDetail";

const BASE_URL = "https://www.studyareasmilan.it";
// Assoluto di proposito: Next non risolve le immagini OG relative col
// metadataBase del layout, e in produzione finirebbero sull'URL di deploy
// invece che sul dominio del sito (canonical e og:url invece lo ereditano).
const FALLBACK_OG_IMAGE = `${BASE_URL}/opengraph-image`;

export async function generateStaticParams() {
  const spaces = await getSpaces();
  // I coworking hanno un dettaglio in SAM for Work, anche se hanno anche altre
  // categorie. Ogni spazio va generato una volta per lingua.
  return spaces
    .filter(isCoworking)
    .flatMap((s) => LOCALES.map((lang) => ({ lang, id: s.id })));
}

export async function generateMetadata({ params }) {
  const { lang } = params;
  const t = getDictionary(lang);
  const space = await getSpaceById(params.id);
  if (!space) {
    return {
      title:
        lang === "en"
          ? "Coworking space not found — SAM for Work"
          : "Coworking non trovato — SAM for Work",
    };
  }

  const title = `${space.name} — SAM for Work`;
  const description = spaceMetaDescription({ ...space, type: "Coworking" }, t);
  const path = `/work/spaces/${space.id}`;

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

export default async function WorkSpaceDetailPage({ params }) {
  const { lang } = params;
  const space = await getSpaceById(params.id);
  if (!space) notFound();
  // I posti che non sono coworking appartengono solo a SAM: reindirizza per
  // tenere separate le sezioni.
  if (!isCoworking(space)) redirect(localeHref(lang, `/spaces/${space.id}`));

  return (
    <div className="theme-work">
      <SpaceDetail
        space={{ ...space, type: displayType(space, "work") }}
        lang={lang}
        backHref="/work/spaces"
        section="work"
      />
    </div>
  );
}
