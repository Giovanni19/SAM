"use client";

import SpaceCard from "./SpaceCard";
import { useI18n } from "@/components/I18nProvider";

export default function SpaceList({ spaces = [], basePath = "/spaces" }) {
  const { t } = useI18n();

  if (!spaces.length) {
    return (
      <div className="rounded-2xl border border-dashed border-sam-muted/40 py-16 text-center">
        <p className="text-4xl">🔍</p>
        <p className="mt-3 font-display font-semibold text-sam-green">{t.results.emptyTitle}</p>
        <p className="mt-1 text-sm text-sam-muted">{t.results.emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {spaces.map((space) => (
        <SpaceCard key={space.id} space={space} basePath={basePath} />
      ))}
    </div>
  );
}
