import { getStudySpaces } from "@/lib/places";
import SpacesExplorer from "@/components/SpacesExplorer";
import { TYPE_META } from "@/lib/utils";
import { getDictionary, localeHref, LOCALES } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export function generateMetadata({ params }) {
  const t = getDictionary(params.lang);
  return {
    title: t.spaces.metaTitle,
    description: t.spaces.metaDescription,
    alternates: {
      canonical: localeHref(params.lang, "/spaces"),
      languages: { it: "/spaces", en: "/en/spaces", "x-default": "/spaces" },
    },
  };
}

export default async function SpacesPage({ params, searchParams }) {
  const t = getDictionary(params.lang);

  // SAM mostra tutti i posti tranne i coworking "puri" (che vivono in SAM for Work).
  const spaces = await getStudySpaces();

  // ?type=Caffetteria (dai link del footer): pre-seleziona quella categoria.
  // Il valore resta canonico (italiano) in entrambe le lingue; qui traduciamo
  // solo il titolo mostrato.
  const requested = searchParams?.type || "";
  const initialType =
    TYPE_META[requested] && requested !== "Altro" && requested !== "Coworking" ? requested : "";
  const heading = initialType ? t.types[initialType] : t.spaces.allTitle;

  return (
    <div className="container-sam py-10">
      <h1 className="font-display text-3xl font-bold text-sam-green">{heading}</h1>
      <p className="mt-1 text-sm text-sam-muted">{t.spaces.allMeta(spaces.length)}</p>

      <div className="mt-6">
        {/* key: rimonta l'explorer quando cambia la categoria via ?type=,
            così il filtro iniziale viene riapplicato anche navigando tra
            due categorie senza ricaricare la pagina. */}
        <SpacesExplorer key={initialType || "all"} spaces={spaces} initialType={initialType} />
      </div>
    </div>
  );
}
