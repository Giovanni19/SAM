import Link from "next/link";
import FavoriteButton from "./FavoriteButton";
import OpenNowBadge from "./OpenNowBadge";
import { typeMeta, getAmenities } from "@/lib/utils";

const TONE_DOT = {
  good: "text-sam-green",
  mid: "text-sam-yellow",
  bad: "text-sam-coral",
};

export default function SpaceCard({ space, basePath = "/spaces" }) {
  const meta = typeMeta(space.type);
  const amenities = getAmenities(space).slice(0, 4);

  return (
    <Link
      href={`${basePath}/${space.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
    >
      {/* Foto se presente, altrimenti header colorato con emoji */}
      <div className="relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br from-sam-green to-sam-green-dark">
        {space.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={space.image} alt={space.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-4xl opacity-90">{meta.emoji}</span>
        )}

        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white ${meta.color}`}
        >
          {meta.emoji} {meta.label}
        </span>

        {space.rating != null && (
          <span
            className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-sam-paper/95 px-2.5 py-1 text-xs font-bold text-sam-green"
            title="Valutazione Google Maps"
          >
            ★ {space.rating}
            {space.reviewsCount != null && (
              <span className="font-normal text-sam-muted">({space.reviewsCount})</span>
            )}
          </span>
        )}

        <div className="absolute right-3 top-3">
          <FavoriteButton spaceId={space.id} size="sm" />
        </div>
      </div>

      {/* Contenuto */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg font-semibold leading-tight text-sam-green">
          {space.name}
        </h3>

        <p className="text-sm text-sam-muted">
          {space.zone && <span className="font-semibold">{space.zone}</span>}
          {space.zone && space.address && " · "}
          <span className="text-sam-muted">{space.address}</span>
        </p>

        {space.hours && <OpenNowBadge hours={space.hours} size="sm" />}

        {space.accessNote && (
          <p className="inline-flex w-fit items-center gap-1 rounded-full bg-sam-yellow/20 px-2.5 py-1 text-xs font-semibold text-sam-brown">
            ⚠️ Accesso con firma residente
          </p>
        )}

        {/* Amenità sintetiche */}
        {amenities.length > 0 && (
          <ul className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-2 text-xs text-sam-brown/80">
            {amenities.map((a) => (
              <li key={a.key} className="inline-flex items-center gap-1">
                <span className={TONE_DOT[a.tone]}>●</span>
                <span>{a.icon} {a.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
