import { getStudySpaces } from "@/lib/notion";
import MapView from "@/components/map/MapView";

export const metadata = {
  title: "Mappa — SAM",
  description: "Tutti gli spazi studio di Milano sulla mappa, con la tua posizione.",
};

export default async function MapPage() {
  // SAM esclude i coworking puri (sono in SAM for Work).
  const spaces = await getStudySpaces();
  const withCoords = spaces.filter((s) => s.lat != null && s.lng != null);

  return (
    <div className="container-sam py-8">
      <h1 className="font-display text-3xl font-bold text-sam-green">Mappa</h1>
      <p className="mt-1 text-sm text-sam-muted">
        {withCoords.length} spazi sulla mappa · attiva la posizione per trovare i più vicini
      </p>

      <div className="mt-6">
        <MapView spaces={withCoords} />
      </div>
    </div>
  );
}
