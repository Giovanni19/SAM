import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Rinnova la sessione (cookie) a ogni richiesta, così server e client
// restano allineati. Non blocca né reindirizza: gestisce solo i cookie.
//
// `makeResponse` permette al middleware di decidere il TIPO di risposta
// (next o rewrite verso /it per la lingua di default) senza perdere i cookie
// di sessione: viene richiamata anche quando Supabase li aggiorna.
export async function updateSession(
  request,
  makeResponse = (req) => NextResponse.next({ request: req })
) {
  let response = makeResponse(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = makeResponse(request);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: rinfresca il token se scaduto.
  await supabase.auth.getUser();

  return response;
}
