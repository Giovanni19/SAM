import { createBrowserClient } from "@supabase/ssr";

// Client Supabase per i componenti CLIENT (browser).
// La sessione è gestita nei cookie (condivisi con il server).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
