"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/useFavorites";
import SpaceList from "./SpaceList";

export default function FavoritesGrid({ spaces = [] }) {
  const { favorites, ready } = useFavorites();

  if (!ready) {
    return <p className="py-16 text-center text-sam-muted">Caricamento…</p>;
  }

  const saved = spaces.filter((s) => favorites.includes(s.id));

  if (!saved.length) {
    return (
      <div className="rounded-2xl border border-dashed border-sam-muted/40 py-16 text-center">
        <p className="text-4xl">♡</p>
        <p className="mt-3 font-display font-semibold text-sam-green">Nessun preferito ancora</p>
        <p className="mt-1 text-sm text-sam-muted">Tocca il cuore su uno spazio per salvarlo qui.</p>
        <Link href="/spaces" className="btn-primary mt-6">Esplora gli spazi</Link>
      </div>
    );
  }

  return <SpaceList spaces={saved} />;
}
