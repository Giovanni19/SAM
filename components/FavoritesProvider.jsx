"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FavoritesContext } from "@/lib/useFavorites";

const STORAGE_KEY = "sam:favorites";
const EVENT = "sam:favorites-changed";

function readLocal() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeLocal(ids) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Sorgente unica dei preferiti:
 *  - loggato  → tabella `favorites` su Supabase (sincronizzata tra dispositivi/app)
 *  - anonimo  → localStorage
 *  - al login → importa i preferiti locali nell'account, poi svuota la cache locale
 */
export default function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const userIdRef = useRef(null);
  const supabaseRef = useRef(null);

  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }

  const loadForUser = useCallback(async (uid) => {
    userIdRef.current = uid;
    setIsLoggedIn(Boolean(uid));
    if (!uid) {
      setFavorites(readLocal());
      setReady(true);
      return;
    }
    setSyncing(true);
    const supabase = getSupabase();
    // Importa gli eventuali preferiti locali nell'account (merge, senza duplicati).
    const local = readLocal();
    if (local.length) {
      await supabase
        .from("favorites")
        .upsert(local.map((place_id) => ({ user_id: uid, place_id })), {
          onConflict: "user_id,place_id",
          ignoreDuplicates: true,
        });
      writeLocal([]); // svuota la cache locale dopo l'import
    }
    const { data } = await supabase.from("favorites").select("place_id");
    setFavorites((data || []).map((r) => r.place_id));
    setReady(true);
    setSyncing(false);
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) loadForUser(data.user?.id ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) loadForUser(session?.user?.id ?? null);
    });

    // Sincronizza tra tab quando anonimo.
    const onLocal = () => {
      if (!userIdRef.current) setFavorites(readLocal());
    };
    window.addEventListener(EVENT, onLocal);
    window.addEventListener("storage", onLocal);

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      window.removeEventListener(EVENT, onLocal);
      window.removeEventListener("storage", onLocal);
    };
  }, [loadForUser]);

  const toggle = useCallback(async (id) => {
    const uid = userIdRef.current;
    const isFav = favorites.includes(id);
    const next = isFav ? favorites.filter((x) => x !== id) : [...favorites, id];
    setFavorites(next); // aggiornamento ottimistico

    if (!uid) {
      writeLocal(next);
      return;
    }
    const supabase = getSupabase();
    const { error } = isFav
      ? await supabase.from("favorites").delete().eq("user_id", uid).eq("place_id", id)
      : await supabase.from("favorites").insert({ user_id: uid, place_id: id });
    if (error) {
      console.error("[favorites] errore di sincronizzazione:", error.message);
      setFavorites(favorites); // ripristina in caso di errore
    }
  }, [favorites]);

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggle, ready, syncing, isLoggedIn }}>
      {children}
    </FavoritesContext.Provider>
  );
}
