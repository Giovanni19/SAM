import Link from "next/link";
import { getStudySpaces } from "@/lib/notion";
import { getZones } from "@/lib/utils";
import SpaceList from "@/components/SpaceList";

export default async function HomePage() {
  // La home di SAM esclude i coworking "puri" (che vivono in SAM for Work).
  const spaces = await getStudySpaces();
  const zones = getZones(spaces);
  const featured = spaces.slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="bg-sam-green text-sam-paper">
        <div className="container-sam py-16 sm:py-24">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-sam-yellow">
            Study Areas Milan
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight text-sam-paper sm:text-5xl">
            Trova il posto giusto per studiare a Milano
          </h1>
          <p className="mt-4 max-w-xl text-lg text-sam-paper/80">
            {spaces.length} spazi selezionati — caffetterie, biblioteche
            e librerie — con WiFi, prese e info su rumore e permanenza.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/spaces" className="btn-primary bg-sam-yellow text-sam-brown hover:bg-sam-orange">
              Esplora gli spazi
            </Link>
            <Link href="/map" className="btn-outline border-sam-paper/40 text-sam-paper hover:bg-sam-paper/10">
              Vedi sulla mappa
            </Link>
          </div>
          {/* Ingresso al sub-brand per lavoratori / sales */}
          <Link
            href="/work"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-sam-work px-4 py-2 text-sm font-semibold text-sam-paper transition hover:bg-sam-work-dark"
          >
            💼 Cerchi un coworking? Prova SAM for Work →
          </Link>
        </div>
      </section>

      {/* Spazi in evidenza */}
      <section className="container-sam py-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-sam-green">
              Spazi in evidenza
            </h2>
            <p className="mt-1 text-sm text-sam-muted">
              {spaces.length} spazi in {zones.length} zone di Milano
            </p>
          </div>
          <Link href="/spaces" className="hidden text-sm font-semibold text-sam-green hover:underline sm:inline">
            Vedi tutti →
          </Link>
        </div>

        <div className="mt-6">
          <SpaceList spaces={featured} />
        </div>
      </section>
    </div>
  );
}
