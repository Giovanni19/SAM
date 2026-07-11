import { getSpaces } from "@/lib/notion";
import SpacesExplorer from "@/components/SpacesExplorer";

export const metadata = {
  title: "Tutti i coworking — SAM for Work",
};

export default async function WorkSpacesPage() {
  // SAM for Work mostra solo i coworking.
  const coworking = (await getSpaces()).filter((s) => s.type === "Coworking");

  return (
    // theme-work: rimappa gli accenti verdi su bordeaux (vedi globals.css).
    <div className="theme-work container-sam py-10">
      <h1 className="font-display text-3xl font-bold text-sam-green">Tutti i coworking</h1>
      <p className="mt-1 text-sm text-sam-muted">
        {coworking.length} coworking dove lavorare a Milano
      </p>

      <div className="mt-6">
        <SpacesExplorer key="work" spaces={coworking} hideType basePath="/work/spaces" />
      </div>
    </div>
  );
}
