"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/I18nProvider";
import { commentTagLabel } from "@/lib/utils";

// Lista dei propri commenti nella pagina account, con possibilità di
// eliminarli. `initialComments` arriva già arricchito dal server con
// `spaceName`/`spaceHref` (lo spazio potrebbe non esistere più). Cliccando
// sulla card si va allo spazio; il pulsante Elimina ferma la propagazione.
export default function MyCommentsList({ initialComments }) {
  const { t, href } = useI18n();
  const [comments, setComments] = useState(initialComments);
  const router = useRouter();

  async function handleDelete(id) {
    const supabase = createClient();
    const prev = comments;
    setComments((c) => c.filter((x) => x.id !== id)); // ottimistico
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) setComments(prev); // ripristina in caso di errore
  }

  if (!comments.length) {
    return (
      <div className="rounded-2xl border border-dashed border-sam-muted/40 py-16 text-center">
        <p className="text-4xl">💬</p>
        <p className="mt-3 font-display font-semibold text-sam-green">{t.myComments.emptyTitle}</p>
        <p className="mt-1 text-sm text-sam-muted">{t.myComments.emptyHint}</p>
        <Link href={href("/spaces")} className="btn-primary mt-6">{t.myComments.emptyCta}</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div
          key={c.id}
          onClick={() => c.spaceHref && router.push(c.spaceHref)}
          className={`rounded-2xl border border-sam-cream bg-white p-4 ${
            c.spaceHref ? "cursor-pointer hover:border-sam-green/50" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-sam-green">
              {c.spaceName || t.myComments.spaceGone}
            </span>
            <span className="text-xs text-sam-muted">
              {new Date(c.created_at).toLocaleDateString(t.dateLocale, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {c.edited_at && ` · ${t.myComments.edited}`}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-sam-brown/90">{c.content}</p>
          {c.tags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {c.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-sam-cream px-2.5 py-0.5 text-[11px] font-medium text-sam-brown">
                  {commentTagLabel(tag, t)}
                </span>
              ))}
            </div>
          )}
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(c.id);
              }}
              className="text-xs font-semibold text-sam-coral hover:underline"
            >
              {t.myComments.delete}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
