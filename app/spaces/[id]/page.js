import Link from "next/link";
import { notFound } from "next/navigation";
import { getSpaceById, getSpaces } from "@/lib/notion";
import { typeMeta, getAmenities } from "@/lib/utils";
import FavoriteButton from "@/components/FavoriteButton";
import PopularTimesChart from "@/components/PopularTimesChart";

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABEL = { mon: "Lun", tue: "Mar", wed: "Mer", thu: "Gio", fri: "Ven", sat: "Sab", sun: "Dom" };

const TONE = {
  good: { dot: "bg-sam-green", text: "text-sam-green" },
  mid: { dot: "bg-sam-yellow", text: "text-sam-brown" },
  bad: { dot: "bg-sam-coral", text: "text-sam-coral" },
};

export async function generateStaticParams() {
  const spaces = await getSpaces();
  return spaces.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }) {
  const space = await getSpaceById(params.id);
  return { title: space ? `${space.name} — SAM` : "Spazio non trovato — SAM" };
}

export default async function SpaceDetailPage({ params }) {
  const space = await getSpaceById(params.id);
  if (!space) notFound();

  const meta = typeMeta(space.type);
  const amenities = getAmenities(space);
  const mapsUrl =
    space.googleMaps ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      space.address || space.name
    )}`;

  return (
    <div className="container-sam py-8">
      <Link href="/spaces" className="text-sm font-semibold text-sam-green hover:underline">
        ← Tutti gli spazi
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
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-sam-paper/15 px-3 py-1 text-xs font-semibold text-sam-paper">
              ★ {space.rating}
              {space.reviewsCount != null && <span className="opacity-70">({space.reviewsCount})</span>}
            </span>
          )}
          <h1 className="mt-3 font-display text-3xl font-bold text-sam-paper">
            {space.name}
          </h1>
          <p className="mt-1 text-sam-paper/80">
            {space.zone && <span className="font-semibold">{space.zone}</span>}
            {space.zone && space.address && " · "}
            {space.address}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <FavoriteButton spaceId={space.id} />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Colonna principale */}
        <div className="lg:col-span-2">
          {space.description && (
            <>
              <h2 className="font-display text-xl font-bold text-sam-green">Descrizione</h2>
              <p className="mt-2 text-sam-brown/90">{space.description}</p>
            </>
          )}

          {/* Aspetti / amenità come sotto-punti */}
          <h2 className="mt-8 font-display text-xl font-bold text-sam-green">
            Com'è per studiare
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

          {space.popularTimes && (
            <div className="mt-8">
              <h2 className="font-display text-xl font-bold text-sam-green">Affollamento</h2>
              <div className="mt-3">
                <PopularTimesChart popularTimes={space.popularTimes} />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-sam-cream bg-white p-5">
            <h3 className="font-display font-semibold text-sam-green">Informazioni</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-sam-green">Tipo</dt>
                <dd className="text-sam-brown/90">{meta.label}</dd>
              </div>
              {space.zone && (
                <div>
                  <dt className="font-semibold text-sam-green">Zona</dt>
                  <dd className="text-sam-brown/90">{space.zone}</dd>
                </div>
              )}
              <div>
                <dt className="font-semibold text-sam-green">Indirizzo</dt>
                <dd className="text-sam-brown/90">{space.address}</dd>
              </div>
              {space.phone && (
                <div>
                  <dt className="font-semibold text-sam-green">Telefono</dt>
                  <dd>
                    <a href={`tel:${space.phone}`} className="text-sam-brown/90 hover:underline">
                      {space.phone}
                    </a>
                  </dd>
                </div>
              )}
              {space.hours && (
                <div>
                  <dt className="font-semibold text-sam-green">Orari</dt>
                  <dd className="mt-1 space-y-0.5 text-sam-brown/90">
                    {DAY_ORDER.filter((d) => space.hours[d]).map((d) => (
                      <div key={d} className="flex justify-between gap-2">
                        <span className="text-sam-muted">{DAY_LABEL[d]}</span>
                        <span>{space.hours[d]}</span>
                      </div>
                    ))}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-5 flex flex-col gap-2">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
                Apri in Google Maps
              </a>
              {space.website && (
                <a href={space.website} target="_blank" rel="noopener noreferrer" className="btn-outline w-full">
                  Sito web
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
