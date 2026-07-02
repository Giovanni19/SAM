import Link from "next/link";
import FavoriteButton from "./FavoriteButton";
import { typeMeta, formatScore, getAmenities } from "@/lib/utils";

const TONE_DOT = {
  good: "text-sam-green",
  mid: "text-sam-yellow",
  bad: "text-sam-coral",
};

export default function SpaceCard({ space }) {
  const meta = typeMeta(space.type);
  const score = formatScore(space.studyScore);
  const amenities = getAmenities(space).slice(0, 4);

  return (
    <Link
      href={`/spaces/${space.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
    >
      {/* Header colorato (nessuna foto nel dataset) */}
      <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-sam-green to-sam-green-dark">
        <span className="text-4xl opacity-90">{meta.emoji}</span>

        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white ${meta.color}`}
        >
          {meta.emoji} {meta.label}
        </span>

        {score != null && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-sam-paper/95 px-2.5 py-1 text-xs font-bold text-sam-green">
            ★ {score}
            <span className="font-normal text-sam-muted">/100</span>
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
