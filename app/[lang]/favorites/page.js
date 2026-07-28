import { getStudySpaces } from "@/lib/notion";
import FavoritesGrid from "@/components/FavoritesGrid";
import { getDictionary, LOCALES } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export function generateMetadata({ params }) {
  return { title: getDictionary(params.lang).favorites.metaTitleSam };
}

export default async function FavoritesPage({ params }) {
  const t = getDictionary(params.lang);
  // Solo posti da studio (i coworking puri si vedono in SAM for Work).
  const spaces = await getStudySpaces();

  return (
    <div className="container-sam py-10">
      <h1 className="font-display text-3xl font-bold text-sam-green">{t.favorites.title}</h1>
      <p className="mt-1 text-sm text-sam-muted">{t.favorites.subtitleSam}</p>

      <div className="mt-8">
        <FavoritesGrid spaces={spaces} />
      </div>
    </div>
  );
}
