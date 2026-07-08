"use client";

import { createContext, useContext } from "react";

// Lo stato vive in <FavoritesProvider> (un'unica sorgente per tutta l'app).
export const FavoritesContext = createContext({
  favorites: [],
  isFavorite: () => false,
  toggle: () => {},
  ready: false,
  syncing: false,
});

export function useFavorites() {
  return useContext(FavoritesContext);
}
