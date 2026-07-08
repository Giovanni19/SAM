import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase per i componenti SERVER (server components, route handler,
// server actions). Legge/scrive la sessione dai cookie della richiesta.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chiamato da un Server Component: ignorabile se c'è il middleware
            // che aggiorna la sessione.
          }
        },
      },
    }
  );
}
