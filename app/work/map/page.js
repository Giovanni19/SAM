import { getWorkSpaces } from "@/lib/notion";
import MapView from "@/components/map/MapView";

export const metadata = {
  title: "Mappa coworking — SAM for Work",
  description: "I coworking di Milano sulla mappa, con la tua posizione.",
};

export default async function WorkMapPage() {
  const coworking = await getWorkSpaces();
  const withCoords = coworking.filter((s) => s.lat != null && s.lng != null);

  return (
    <div className="theme-work container-sam py-8">
      <h1 className="font-display text-3xl font-bold text-sam-green">Mappa</h1>
      <p className="mt-1 text-sm text-sam-muted">
        {withCoords.length} coworking sulla mappa · attiva la posizione per trovare i più vicini
      </p>

      <div className="mt-6">
        <MapView spaces={withCoords} hideType basePath="/work/spaces" />
      </div>
    </div>
  );
}
