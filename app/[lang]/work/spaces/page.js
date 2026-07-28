import { getWorkSpaces } from "@/lib/notion";
import SpacesExplorer from "@/components/SpacesExplorer";
import { getDictionary, localeHref, LOCALES } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export function generateMetadata({ params }) {
  const t = getDictionary(params.lang);
  return {
    title: t.spaces.workMetaTitle,
    description: t.spaces.workMetaDescription,
    alternates: {
      canonical: localeHref(params.lang, "/work/spaces"),
      languages: { it: "/work/spaces", en: "/en/work/spaces", "x-default": "/work/spaces" },
    },
  };
}

export default async function WorkSpacesPage({ params }) {
  const t = getDictionary(params.lang);
  // SAM for Work mostra i coworking (anche se hanno anche altre categorie).
  const coworking = await getWorkSpaces();

  return (
    // theme-work: rimappa gli accenti verdi su bordeaux (vedi globals.css).
    <div className="theme-work container-sam py-10">
      <h1 className="font-display text-3xl font-bold text-sam-green">{t.spaces.workTitle}</h1>
      <p className="mt-1 text-sm text-sam-muted">{t.spaces.workMeta(coworking.length)}</p>

      <div className="mt-6">
        <SpacesExplorer key="work" spaces={coworking} hideType basePath="/work/spaces" />
      </div>
    </div>
  );
}
