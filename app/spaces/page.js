import { getSpaces } from "@/lib/notion";
import SpacesExplorer from "@/components/SpacesExplorer";
import { TYPE_META } from "@/lib/utils";

export const metadata = {
  title: "Tutti gli spazi — SAM",
};

export default async function SpacesPage({ searchParams }) {
  const spaces = await getSpaces();

  // ?type=Caffetteria (dai link del footer): pre-seleziona quella categoria.
  // Accetto solo tipi validi, così un valore casuale non svuota la lista.
  const requested = searchParams?.type || "";
  const initialType = TYPE_META[requested] && requested !== "Altro" ? requested : "";
  const heading = initialType ? TYPE_META[initialType].label : "Tutti gli spazi";

  return (
    <div className="container-sam py-10">
      <h1 className="font-display text-3xl font-bold text-sam-green">{heading}</h1>
      <p className="mt-1 text-sm text-sam-muted">
        {spaces.length} spazi dove studiare e lavorare a Milano
      </p>

      <div className="mt-6">
        {/* key: rimonta l'explorer quando cambia la categoria via ?type=,
            così il filtro iniziale viene riapplicato anche navigando tra
            due categorie senza ricaricare la pagina. */}
        <SpacesExplorer key={initialType || "all"} spaces={spaces} initialType={initialType} />
      </div>
    </div>
  );
}
