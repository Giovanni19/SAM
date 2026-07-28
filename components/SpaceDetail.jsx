import Link from "next/link";
import { typeMeta, getAmenities, spaceJsonLd, spaceDescription } from "@/lib/utils";
import { getDictionary, localeHref } from "@/lib/i18n";
import FavoriteButton from "@/components/FavoriteButton";
import ShareButton from "@/components/ShareButton";
import PopularTimesChart from "@/components/PopularTimesChart";
import OpenNowBadge from "@/components/OpenNowBadge";
import Comments from "@/components/Comments";

const BASE_URL = "https://www.studyareasmilan.it";

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const TONE = {
  good: { dot: "bg-sam-green", text: "text-sam-green" },
  mid: { dot: "bg-sam-yellow", text: "text-sam-brown" },
  bad: { dot: "bg-sam-coral", text: "text-sam-coral" },
};

// Dettaglio di uno spazio. Riusato da SAM (/spaces/[id]) e SAM for Work
// (/work/spaces/[id]); `backHref`/`backLabel` cambiano il link "indietro", e
// il tema rosso arriva dal wrapper .theme-work della pagina Work.
export default function SpaceDetail({ space, lang, backHref = "/spaces", section = "study" }) {
  const t = getDictionary(lang);
  const href = (path) => localeHref(lang, path);
  const meta = typeMeta(space.type, t);
  const amenities = getAmenities(space, t);
  const backLabel = section === "work" ? t.detail.backCoworking : t.detail.backSpaces;
  const amenitiesTitle = section === "work" ? t.detail.amenitiesWork : t.detail.amenitiesStudy;
  const description = spaceDescription(space, lang);
  const mapsUrl =
    space.googleMaps ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      space.address || space.name
    )}`;

  // Canonical della lingua corrente: in inglese l'URL include il prefisso /en.
  const canonicalUrl = `${BASE_URL}${href(`${backHref}/${space.id}`)}`;

  // JSON-LD (dati strutturati Schema.org per i motori di ricerca). Il `<` è
  // escapato per sicurezza: rompe un eventuale "</script>" nascosto nei testi.
  const jsonLd = spaceJsonLd(space, canonicalUrl, lang);
  const jsonLdHtml = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return (
    <div className="container-sam py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml }}
      />

      <Link href={href(backHref)} className="text-sm font-semibold text-sam-green hover:underline">
        {backLabel}
      </Link>

      {/* Foto, se presente */}
      {space.image && (
        <div className="mt-4 h-56 overflow-hidden rounded-2xl sm:h-72">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={space.image} alt={space.name} className="h-full w-full object-cover" />
        </div>
      )}

      {/* Hero */}
      <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-sam-green to-sam-green-dark p-6 text-sam-paper sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white ${meta.color}`}>
            {meta.emoji} {meta.label}
          </span>
          {space.rating != null && (
            <span
              className="ml-2 inline-flex items-center gap-1 rounded-full bg-sam-paper/15 px-3 py-1 text-xs font-semibold text-sam-paper"
              title={t.detail.ratingTitle}
            >
              ★ {space.rating}
              {space.reviewsCount != null && <span className="opacity-70">({space.reviewsCount})</span>}
              <span className="opacity-70">· Google</span>
            </span>
          )}
          {/* !text-sam-paper: nel tema rosso i titoli diventano bordeaux; qui
              serve il chiaro sull'hero, quindi lo forziamo. */}
          <h1 className="mt-3 font-display text-3xl font-bold !text-sam-paper">
            {space.name}
          </h1>
          <p className="mt-1 text-sam-paper/80">
            {space.zone && <span className="font-semibold">{space.zone}</span>}
            {space.zone && space.address && " · "}
            {space.address}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ShareButton url={canonicalUrl} title={space.name} text={description} />
          <FavoriteButton spaceId={space.id} />
        </div>
      </div>

      {space.accessNote && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-sam-yellow/60 bg-sam-yellow/15 p-4">
          <span className="text-lg">⚠️</span>
          <p className="text-sm font-medium text-sam-brown">
            <span className="font-semibold">{t.detail.warning}</span>
            {space.accessNote}
          </p>
        </div>
      )}

      {space.bookingNote && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-sam-green/30 bg-sam-green/10 p-4">
          <span className="text-lg">📅</span>
          <p className="text-sm font-medium text-sam-brown">
            <span className="font-semibold">{t.detail.booking}</span>
            {space.bookingNote}
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Colonna principale */}
        {/* order-2/order-1: su mobile (una sola colonna) le Informazioni
            (orari, telefono, prenota) vengono prima dei commenti; da lg in su
            torna il layout a due colonne col ordine naturale del DOM. */}
        <div className="order-2 lg:order-1 lg:col-span-2">
          {description && (
            <>
              <h2 className="font-display text-xl font-bold text-sam-green">{t.detail.description}</h2>
              <p className="mt-2 text-sam-brown/90">{description}</p>
            </>
          )}

          {/* Aspetti / amenità come sotto-punti */}
          <h2 className="mt-8 font-display text-xl font-bold text-sam-green">
            {amenitiesTitle}
          </h2>
          <ul className="mt-3 divide-y divide-sam-cream rounded-2xl border border-sam-cream bg-white">
            {amenities.map((a) => {
              const tone = TONE[a.tone] || TONE.mid;
              return (
                <li key={a.key} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg">{a.icon}</span>
                  <span className="w-28 shrink-0 text-sm font-semibold text-sam-green">
                    {a.group}
                  </span>
                  <span className={`inline-block h-2 w-2 rounded-full ${tone.dot}`} />
                  <span className={`text-sm font-medium ${tone.text}`}>{a.label}</span>
                </li>
              );
            })}
          </ul>

          <div className="mt-8">
            <h2 className="font-display text-xl font-bold text-sam-green">{t.detail.crowding}</h2>
            <div className="mt-3">
              {space.popularTimes ? (
                <PopularTimesChart popularTimes={space.popularTimes} />
              ) : (
                <div className="rounded-2xl border border-sam-cream bg-white p-5 text-sm text-sam-muted">
                  {t.detail.noCrowding}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <Comments placeId={space.id} spaceType={space.type} />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="order-1 space-y-4 lg:order-2">
          <div className="rounded-2xl border border-sam-cream bg-white p-5">
            <h3 className="font-display font-semibold text-sam-green">{t.detail.info}</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-sam-green">{t.detail.type}</dt>
                <dd className="text-sam-brown/90">{meta.label}</dd>
              </div>
              {space.zone && (
                <div>
                  <dt className="font-semibold text-sam-green">{t.detail.zone}</dt>
                  <dd className="text-sam-brown/90">{space.zone}</dd>
                </div>
              )}
              <div>
                <dt className="font-semibold text-sam-green">{t.detail.address}</dt>
                <dd className="text-sam-brown/90">{space.address}</dd>
              </div>
              {space.phone && (
                <div>
                  <dt className="font-semibold text-sam-green">{t.detail.phone}</dt>
                  <dd>
                    <a href={`tel:${space.phone}`} className="text-sam-brown/90 hover:underline">
                      {space.phone}
                    </a>
                  </dd>
                </div>
              )}
              {space.hours && (
                <div>
                  <dt className="flex items-center gap-2 font-semibold text-sam-green">
                    {t.detail.hours} <OpenNowBadge hours={space.hours} size="sm" />
                  </dt>
                  <dd className="mt-1 space-y-0.5 text-sam-brown/90">
                    {DAY_ORDER.filter((d) => space.hours[d]).map((d) => (
                      <div key={d} className="flex justify-between gap-2">
                        <span className="text-sam-muted">{t.days[d]}</span>
                        <span>{space.hours[d]}</span>
                      </div>
                    ))}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-5 flex flex-col gap-2">
              {space.bookingUrl && (
                <a href={space.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
                  {t.detail.book}
                </a>
              )}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={space.bookingUrl ? "btn-outline w-full" : "btn-primary w-full"}
              >
                {t.detail.openMaps}
              </a>
              {space.website && (
                <a href={space.website} target="_blank" rel="noopener noreferrer" className="btn-outline w-full">
                  {t.detail.website}
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
