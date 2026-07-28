import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSpaces } from "@/lib/notion";
import { isStudySpace } from "@/lib/utils";
import MyCommentsList from "@/components/MyCommentsList";
import { getDictionary, localeHref } from "@/lib/i18n";

export function generateMetadata({ params }) {
  return { title: getDictionary(params.lang).comments.myMetaTitle };
}

// Pagina protetta: renderizzata dinamicamente (legge la sessione).
export const dynamic = "force-dynamic";

export default async function MyCommentsPage({ params }) {
  const { lang } = params;
  const t = getDictionary(lang);
  const href = (path) => localeHref(lang, path);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(href("/login"));

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
      spaceHref:
        space && href(isStudySpace(space) ? `/spaces/${space.id}` : `/work/spaces/${space.id}`),
    };
  });

  return (
    <div className="container-sam py-12">
      <h1 className="font-display text-3xl font-bold text-sam-green">{t.comments.myTitle}</h1>
      <p className="mt-1 text-sm text-sam-muted">{t.comments.mySubtitle}</p>

      <div className="mt-8">
        <MyCommentsList initialComments={enriched} />
      </div>
    </div>
  );
}
