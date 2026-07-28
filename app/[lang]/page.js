import Link from "next/link";
import { getStudySpaces } from "@/lib/notion";
import { getZones } from "@/lib/utils";
import { getDictionary, localeHref, LOCALES } from "@/lib/i18n";
import SpaceList from "@/components/SpaceList";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function HomePage({ params }) {
  const { lang } = params;
  const t = getDictionary(lang);
  const href = (path) => localeHref(lang, path);

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
            {t.home.eyebrow}
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight text-sam-paper sm:text-5xl">
            {t.home.title}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-sam-paper/80">{t.home.subtitle(spaces.length)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={href("/spaces")} className="btn-primary bg-sam-yellow text-sam-brown hover:bg-sam-orange">
              {t.home.explore}
            </Link>
            <Link href={href("/map")} className="btn-outline border-sam-paper/40 text-sam-paper hover:bg-sam-paper/10">
              {t.home.viewMap}
            </Link>
          </div>
          {/* Ingresso al sub-brand per lavoratori / sales */}
          <Link
            href={href("/work")}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-sam-work px-4 py-2 text-sm font-semibold text-sam-paper transition hover:bg-sam-work-dark"
          >
            {t.home.crossCta}
          </Link>
        </div>
      </section>

      {/* Spazi in evidenza */}
      <section className="container-sam py-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-sam-green">{t.home.featured}</h2>
            <p className="mt-1 text-sm text-sam-muted">
              {t.home.featuredMeta(spaces.length, zones.length)}
            </p>
          </div>
          <Link href={href("/spaces")} className="hidden text-sm font-semibold text-sam-green hover:underline sm:inline">
            {t.home.viewAll}
          </Link>
        </div>

        <div className="mt-6">
          <SpaceList spaces={featured} />
        </div>
      </section>
    </div>
  );
}
