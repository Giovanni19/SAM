import { getWorkSpaces } from "@/lib/notion";
import FavoritesGrid from "@/components/FavoritesGrid";
import { getDictionary, LOCALES } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export function generateMetadata({ params }) {
  return { title: getDictionary(params.lang).favorites.metaTitleWork };
}

export default async function WorkFavoritesPage({ params }) {
  const t = getDictionary(params.lang);
  const coworking = await getWorkSpaces();

  return (
    <div className="theme-work container-sam py-10">
      <h1 className="font-display text-3xl font-bold text-sam-green">{t.favorites.title}</h1>
      <p className="mt-1 text-sm text-sam-muted">{t.favorites.subtitleWork}</p>

      <div className="mt-8">
        <FavoritesGrid spaces={coworking} basePath="/work/spaces" />
      </div>
    </div>
  );
}
