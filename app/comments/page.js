import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSpaces } from "@/lib/notion";

export const metadata = { title: "I tuoi commenti — SAM" };

// Pagina protetta: renderizzata dinamicamente (legge la sessione).
export const dynamic = "force-dynamic";

export default async function MyCommentsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: comments }, spaces] = await Promise.all([
    supabase
      .from("comments")
      .select("id, place_id, content, tags, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    getSpaces(),
  ]);

  const spaceById = Object.fromEntries(spaces.map((s) => [s.id, s]));

  return (
    <div className="container-sam py-12">
      <h1 className="font-display text-3xl font-bold text-sam-green">I tuoi commenti</h1>
      <p className="mt-1 text-sm text-sam-muted">Tutti i commenti che hai lasciato sugli spazi.</p>

      <div className="mt-8 space-y-3">
        {!comments?.length && (
          <div className="rounded-2xl border border-dashed border-sam-muted/40 py-16 text-center">
            <p className="text-4xl">💬</p>
            <p className="mt-3 font-display font-semibold text-sam-green">Ancora nessun commento</p>
            <p className="mt-1 text-sm text-sam-muted">Lascia un commento su uno spazio per vederlo qui.</p>
            <Link href="/spaces" className="btn-primary mt-6">Esplora gli spazi</Link>
          </div>
        )}
        {comments?.map((c) => {
          const space = spaceById[c.place_id];
          const href = space && (space.type === "Coworking" ? `/work/spaces/${space.id}` : `/spaces/${space.id}`);
          return (
            <div key={c.id} className="rounded-2xl border border-sam-cream bg-white p-4">
              <div className="flex items-center justify-between">
                {href ? (
                  <Link href={href} className="text-sm font-semibold text-sam-green hover:underline">
                    {space.name}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-sam-muted">Spazio non più disponibile</span>
                )}
                <span className="text-xs text-sam-muted">
                  {new Date(c.created_at).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-sam-brown/90">{c.content}</p>
              {c.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.tags.map((t) => (
                    <span key={t} className="rounded-full bg-sam-cream px-2.5 py-0.5 text-[11px] font-medium text-sam-brown">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
