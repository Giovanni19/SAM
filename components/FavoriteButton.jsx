"use client";

import { useFavorites } from "@/lib/useFavorites";
import { useAuthPrompt } from "@/components/AuthPrompt";
import { cn } from "@/lib/utils";

export default function FavoriteButton({ spaceId, className, size = "md" }) {
  const { isFavorite, toggle, ready, isLoggedIn } = useFavorites();
  const { show } = useAuthPrompt();
  const active = ready && isFavorite(spaceId);

  const sizes = {
    sm: "h-8 w-8 text-base",
    md: "h-10 w-10 text-lg",
  };

  return (
    <button
      type="button"
      aria-label={active ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // I preferiti si salvano solo con un account: se non sei loggato,
        // mostra il banner di invito ad accedere invece di salvare.
        if (!isLoggedIn) {
          show("Accedi o registrati per salvarlo nei tuoi preferiti");
          return;
        }
        toggle(spaceId);
      }}
      className={cn(
        "flex items-center justify-center rounded-full bg-sam-paper/90 shadow-card backdrop-blur transition hover:scale-110 active:scale-95",
        sizes[size],
        className
      )}
    >
      <span className={active ? "text-sam-coral" : "text-sam-muted"}>
        {active ? "♥" : "♡"}
      </span>
    </button>
  );
}
