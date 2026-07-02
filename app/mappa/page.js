import { getSpaces } from "@/lib/notion";
import SpacesMapExplorer from "@/components/SpacesMapExplorer";

export const metadata = {
  title: "Mappa — SAM",
};

export default async function MappaPage() {
  const spaces = await getSpaces();

  return (
    <div className="container-sam py-10">
      <h1 className="font-display text-3xl font-bold text-sam-green">
        Mappa degli spazi
      </h1>
      <p className="mt-1 text-sm text-sam-muted">
        {spaces.length} spazi dove studiare e lavorare a Milano — colore per categoria
      </p>

      <div className="mt-6">
        <SpacesMapExplorer spaces={spaces} />
      </div>
    </div>
  );
}
