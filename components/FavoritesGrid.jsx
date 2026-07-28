"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/useFavorites";
import SpaceList from "./SpaceList";
import { useI18n } from "@/components/I18nProvider";

export default function FavoritesGrid({ spaces = [], basePath = "/spaces" }) {
  const { t, href } = useI18n();
  const { favorites, ready } = useFavorites();

  if (!ready) {
    return <p className="py-16 text-center text-sam-muted">{t.favorites.loading}</p>;
  }

  const saved = spaces.filter((s) => favorites.includes(s.id));

  if (!saved.length) {
    return (
      <div className="rounded-2xl border border-dashed border-sam-muted/40 py-16 text-center">
        <p className="text-4xl">♡</p>
        <p className="mt-3 font-display font-semibold text-sam-green">{t.favorites.emptyTitle}</p>
        <p className="mt-1 text-sm text-sam-muted">{t.favorites.emptyHint}</p>
        <Link href={href(basePath)} className="btn-primary mt-6">{t.favorites.explore}</Link>
      </div>
    );
  }

  return <SpaceList spaces={saved} basePath={basePath} />;
}
