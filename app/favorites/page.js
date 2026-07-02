import { getSpaces } from "@/lib/notion";
import FavoritesGrid from "@/components/FavoritesGrid";

export const metadata = {
  title: "I tuoi preferiti — SAM",
};

export default async function FavoritesPage() {
  const spaces = await getSpaces();

  return (
    <div className="container-sam py-10">
      <h1 className="font-display text-3xl font-bold text-sam-green">I tuoi preferiti</h1>
      <p className="mt-1 text-sm text-sam-muted">
        Gli spazi che hai salvato, disponibili solo su questo dispositivo.
      </p>

      <div className="mt-8">
        <FavoritesGrid spaces={spaces} />
      </div>
    </div>
  );
}
