import { getWorkSpaces } from "@/lib/places";
import MapView from "@/components/map/MapView";
import { getDictionary, localeHref, LOCALES } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export function generateMetadata({ params }) {
  const t = getDictionary(params.lang);
  return {
    title: t.map.metaTitleWork,
    description: t.map.metaDescriptionWork,
    alternates: {
      canonical: localeHref(params.lang, "/work/map"),
      languages: { it: "/work/map", en: "/en/work/map", "x-default": "/work/map" },
    },
  };
}

export default async function WorkMapPage({ params }) {
  const t = getDictionary(params.lang);
  const coworking = await getWorkSpaces();
  const withCoords = coworking.filter((s) => s.lat != null && s.lng != null);

  return (
    <div className="theme-work container-sam py-8">
      <h1 className="font-display text-3xl font-bold text-sam-green">{t.map.title}</h1>
      <p className="mt-1 text-sm text-sam-muted">{t.map.countWork(withCoords.length)}</p>

      <div className="mt-6">
        <MapView spaces={withCoords} hideType basePath="/work/spaces" />
      </div>
    </div>
  );
}
