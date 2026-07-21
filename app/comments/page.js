import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSpaces } from "@/lib/notion";
import MyCommentsList from "@/components/MyCommentsList";

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
      .select("id, place_id, content, tags, edited_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    getSpaces(),
  ]);

  const spaceById = Object.fromEntries(spaces.map((s) => [s.id, s]));
  const enriched = (comments || []).map((c) => {
    const space = spaceById[c.place_id];
    return {
      ...c,
      spaceName: space?.name,
      spaceHref: space && (space.type === "Coworking" ? `/work/spaces/${space.id}` : `/spaces/${space.id}`),
    };
  });

  return (
    <div className="container-sam py-12">
      <h1 className="font-display text-3xl font-bold text-sam-green">I tuoi commenti</h1>
      <p className="mt-1 text-sm text-sam-muted">Tutti i commenti che hai lasciato sugli spazi.</p>

      <div className="mt-8">
        <MyCommentsList initialComments={enriched} />
      </div>
    </div>
  );
}
