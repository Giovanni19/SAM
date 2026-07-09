import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Gestisce sia il flusso PKCE (link con ?code=…, default Supabase) sia il
// flusso OTP (?token_hash=…&type=…). Copre email di conferma, magic link e
// reset password.
//
// IMPORTANTE: i cookie di sessione vengono scritti DIRETTAMENTE nella risposta
// di redirect. Se si crea la sessione con un client che scrive i cookie altrove
// e poi si restituisce un redirect "nuovo", i cookie si perdono e l'utente
// torna al sito senza risultare loggato.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/account";

  // La risposta su cui il client Supabase scriverà i cookie di sessione.
  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return response;
  }

  return NextResponse.redirect(`${origin}/login?error=link_scaduto`);
}
