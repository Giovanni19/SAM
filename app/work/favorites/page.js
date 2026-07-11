import { getSpaces } from "@/lib/notion";
import FavoritesGrid from "@/components/FavoritesGrid";

export const metadata = {
  title: "I tuoi coworking preferiti — SAM for Work",
};

export default async function WorkFavoritesPage() {
  const coworking = (await getSpaces()).filter((s) => s.type === "Coworking");

  return (
    <div className="theme-work container-sam py-10">
      <h1 className="font-display text-3xl font-bold text-sam-green">I tuoi preferiti</h1>
      <p className="mt-1 text-sm text-sam-muted">
        I coworking che hai salvato, disponibili solo su questo dispositivo.
      </p>

      <div className="mt-8">
        <FavoritesGrid spaces={coworking} basePath="/work/spaces" />
      </div>
    </div>
  );
}
