"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sam:favorites";
const EVENT = "sam:favorites-changed";

function readFavorites() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeFavorites(ids) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(EVENT));
}

/** Hook per gestire i preferiti salvati in localStorage. */
export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFavorites(readFavorites());
    setReady(true);

    const sync = () => setFavorites(readFavorites());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((id) => {
    const current = readFavorites();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    writeFavorites(next);
  }, []);

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);

  return { favorites, isFavorite, toggle, ready };
}
