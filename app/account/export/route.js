import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Esportazione dei dati personali (diritto alla portabilità, art. 20 GDPR).
// Raccoglie account + profilo + preferiti dell'utente loggato e li restituisce
// come file JSON scaricabile, in un formato strutturato e leggibile.
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  // RLS garantisce che si leggano solo le righe dell'utente stesso.
  const [{ data: profile }, { data: favorites }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("favorites").select("place_id, created_at").eq("user_id", user.id),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      metadata: user.user_metadata || {},
    },
    profile: profile || null,
    favorites: favorites || [],
  };

  const body = JSON.stringify(payload, null, 2);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="sam-dati-${user.id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
