import Link from "next/link";
import { getWorkSpaces } from "@/lib/places";
import { getZones } from "@/lib/utils";
import { getDictionary, localeHref, LOCALES } from "@/lib/i18n";
import SpaceList from "@/components/SpaceList";
import { selezionaInEvidenza } from "@/lib/featured";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

// Vedi la home: la vetrina ruota ogni lunedì e va rigenerata.
export const revalidate = 3600;

export function generateMetadata({ params }) {
  const t = getDictionary(params.lang);
  return {
    title: t.work.metaTitle,
    description: t.work.metaDescription,
    alternates: {
      canonical: localeHref(params.lang, "/work"),
      languages: { it: "/work", en: "/en/work", "x-default": "/work" },
    },
  };
}

export default async function WorkHomePage({ params }) {
  const { lang } = params;
  const t = getDictionary(lang);
  const href = (path) => localeHref(lang, path);

  // SAM for Work mostra i coworking (anche se hanno anche altre categorie).
  const coworking = await getWorkSpaces();
  const zones = getZones(coworking);
  // Qui i posti sono tutti coworking, quindi il vincolo sul tipo non serve; e
  // la permanenza a pagamento è la norma, non un difetto da penalizzare.
  const featured = selezionaInEvidenza(coworking, {
    maxPerType: 6,
    campiStudio: ["wifi", "prese", "sedute", "rumore"],
  });

  return (
    <div>
      {/* Hero rosso (fuori da .theme-work: bottoni e CTA usano colori espliciti) */}
      <section className="bg-sam-work text-sam-paper">
        <div className="container-sam py-16 sm:py-24">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-sam-work-tint">
            {t.work.eyebrow}
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight text-sam-paper sm:text-5xl">
            {t.work.title}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-sam-paper/80">{t.work.subtitle(coworking.length)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={href("/work/spaces")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sam-yellow px-5 py-2.5 font-display text-sm font-semibold text-sam-brown transition hover:bg-sam-orange active:scale-95"
            >
              {t.work.explore}
            </Link>
            <Link
              href={href("/work/map")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sam-paper/40 bg-transparent px-5 py-2.5 font-display text-sm font-semibold text-sam-paper transition hover:bg-sam-paper/10 active:scale-95"
            >
              {t.work.viewMap}
            </Link>
          </div>
          {/* CTA verso SAM (verde) — speculare alla CTA rossa sulla home di SAM */}
          <Link
            href={href("/")}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-sam-green px-4 py-2 text-sm font-semibold text-sam-paper transition hover:bg-sam-green-dark"
          >
            {t.work.crossCta}
          </Link>
        </div>
      </section>

      {/* Coworking in evidenza (tema rosso) */}
      <section className="theme-work container-sam py-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-sam-green">{t.work.featured}</h2>
            <p className="mt-1 text-sm text-sam-muted">
              {t.work.featuredMeta(coworking.length, zones.length)}
            </p>
          </div>
          <Link href={href("/work/spaces")} className="hidden text-sm font-semibold text-sam-green hover:underline sm:inline">
            {t.work.viewAll}
          </Link>
        </div>

        <div className="mt-6">
          <SpaceList spaces={featured} basePath="/work/spaces" />
        </div>
      </section>
    </div>
  );
}
