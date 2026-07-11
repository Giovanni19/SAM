import Link from "next/link";
import { getSpaces } from "@/lib/notion";
import { getZones } from "@/lib/utils";
import SpaceList from "@/components/SpaceList";

export const metadata = {
  title: "SAM for Work — Coworking a Milano",
  description:
    "Gli spazi di coworking di Milano selezionati da SAM: day pass, sale riunioni e WiFi veloce per lavoratori e team commerciali.",
};

export default async function WorkHomePage() {
  // SAM for Work mostra solo i coworking.
  const coworking = (await getSpaces()).filter((s) => s.type === "Coworking");
  const zones = getZones(coworking);
  const featured = coworking.slice(0, 6);

  return (
    <div>
      {/* Hero rosso (fuori da .theme-work: bottoni e CTA usano colori espliciti) */}
      <section className="bg-sam-work text-sam-paper">
        <div className="container-sam py-16 sm:py-24">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-sam-work-tint">
            SAM for Work
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight text-sam-paper sm:text-5xl">
            Trova il posto giusto per lavorare a Milano
          </h1>
          <p className="mt-4 max-w-xl text-lg text-sam-paper/80">
            {coworking.length} coworking selezionati — day pass, sale riunioni e WiFi veloce
            per lavoratori e team commerciali.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/work/spaces"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sam-yellow px-5 py-2.5 font-display text-sm font-semibold text-sam-brown transition hover:bg-sam-orange active:scale-95"
            >
              Esplora i coworking
            </Link>
            <Link
              href="/work/map"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sam-paper/40 bg-transparent px-5 py-2.5 font-display text-sm font-semibold text-sam-paper transition hover:bg-sam-paper/10 active:scale-95"
            >
              Vedi sulla mappa
            </Link>
          </div>
          {/* CTA verso SAM (verde) — speculare alla CTA rossa sulla home di SAM */}
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-sam-green px-4 py-2 text-sm font-semibold text-sam-paper transition hover:bg-sam-green-dark"
          >
            📚 Cerchi un posto per studiare? Prova SAM →
          </Link>
        </div>
      </section>

      {/* Coworking in evidenza (tema rosso) */}
      <section className="theme-work container-sam py-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-sam-green">
              Coworking in evidenza
            </h2>
            <p className="mt-1 text-sm text-sam-muted">
              {coworking.length} coworking in {zones.length} zone di Milano
            </p>
          </div>
          <Link href="/work/spaces" className="hidden text-sm font-semibold text-sam-green hover:underline sm:inline">
            Vedi tutti →
          </Link>
        </div>

        <div className="mt-6">
          <SpaceList spaces={featured} basePath="/work/spaces" />
        </div>
      </section>
    </div>
  );
}
