import { getSpaces } from "@/lib/notion";
import SpacesExplorer from "@/components/SpacesExplorer";

export const metadata = {
  title: "Tutti gli spazi — SAM",
};

export default async function SpacesPage() {
  const spaces = await getSpaces();

  return (
    <div className="container-sam py-10">
      <h1 className="font-display text-3xl font-bold text-sam-green">
        Tutti gli spazi
      </h1>
      <p className="mt-1 text-sm text-sam-muted">
        {spaces.length} spazi dove studiare e lavorare a Milano
      </p>

      <div className="mt-6">
        <SpacesExplorer spaces={spaces} />
      </div>
    </div>
  );
}
