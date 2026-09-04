import { getStudySpaces } from "@/lib/places";
import MapView from "@/components/map/MapView";
import { getDictionary, localeHref, LOCALES } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export function generateMetadata({ params }) {
  const t = getDictionary(params.lang);
  return {
    title: t.map.metaTitleSam,
    description: t.map.metaDescriptionSam,
    alternates: {
      canonical: localeHref(params.lang, "/map"),
      languages: { it: "/map", en: "/en/map", "x-default": "/map" },
    },
  };
}

export default async function MapPage({ params }) {
  const t = getDictionary(params.lang);
  // SAM esclude i coworking puri (sono in SAM for Work).
  const spaces = await getStudySpaces();
  const withCoords = spaces.filter((s) => s.lat != null && s.lng != null);

  return (
    <div className="container-sam py-8">
      <h1 className="font-display text-3xl font-bold text-sam-green">{t.map.title}</h1>
      <p className="mt-1 text-sm text-sam-muted">{t.map.countSam(withCoords.length)}</p>

      <div className="mt-6">
        <MapView spaces={withCoords} />
      </div>
    </div>
  );
}
