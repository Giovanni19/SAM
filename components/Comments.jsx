"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthPrompt } from "@/components/AuthPrompt";
import { useI18n } from "@/components/I18nProvider";
import { COMMENT_FEEDBACK, commentTagLabel } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-sam-cream bg-sam-paper px-4 py-2.5 text-sm outline-none focus:border-sam-green";

// Feedback libero di chi ha usato il posto — non è lo stesso "verificato"
// dei filtri (quello descrive lo spazio, questo l'esperienza di chi ci va).
// Una sola scelta per categoria (pro/neutro/contro): evita combinazioni
// contraddittorie tipo "WiFi veloce" + "WiFi lento" sullo stesso commento.
// Stile del chip in base alla posizione nella terna (0=pro, 1=neutro, 2=contro).
const TONE_CLASS = [
  "bg-sam-green text-sam-paper",
  "bg-sam-muted text-sam-paper",
  "bg-sam-coral text-sam-paper",
];

// Selettore pro/neutro/contro per categoria: usato sia per un nuovo commento
// che per modificarne uno esistente.
function CategoryPicker({ categories, selected, onSelect, t }) {
  return (
    <div className="space-y-1.5">
      {categories.map(({ key, options }) => (
        <div key={key} className="flex flex-wrap items-center gap-1.5">
          <span className="w-28 shrink-0 text-xs font-semibold text-sam-green">
            {t.comments.groups[key] ?? key}
          </span>
          {options.map((opt, i) => {
            const active = selected[key] === opt;
            return (
              <button
                key={opt}
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(key, opt)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  active ? TONE_CLASS[i] : "bg-sam-cream text-sam-brown hover:bg-sam-cream/70"
                }`}
              >
                {commentTagLabel(opt, t)}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Commenti pubblici per spazio. Chiunque li legge; solo chi è loggato può
// scriverne, modificarne uno proprio o segnalarne uno altrui. Moderazione
// minima: dopo 3 segnalazioni distinte un commento si nasconde da solo (vedi
// report_comment() in supabase/schema.sql) — niente pannello admin per ora.
export default function Comments({ placeId, spaceType }) {
  const { t } = useI18n();
  // Le biblioteche non hanno un prezzo da valutare.
  const categories = COMMENT_FEEDBACK.filter(
    (c) => !(spaceType === "Biblioteca" && c.key === "prezzi")
  );

  const [comments, setComments] = useState([]);
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [content, setContent] = useState("");
  // Una scelta per categoria: { pulizia: "🧼 Ambiente pulito", wifi: "😐 WiFi nella media", ... }
  const [selected, setSelected] = useState({});
  const [anonymous, setAnonymous] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [reported, setReported] = useState([]);
  const [likeCounts, setLikeCounts] = useState({});
  const [likedByMe, setLikedByMe] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editSelected, setEditSelected] = useState({});
  const [editPending, setEditPending] = useState(false);
  const { show } = useAuthPrompt();

  const selectOption = (key, label) =>
    setSelected((s) => (s[key] === label ? { ...s, [key]: undefined } : { ...s, [key]: label }));
  const selectEditOption = (key, label) =>
    setEditSelected((s) => (s[key] === label ? { ...s, [key]: undefined } : { ...s, [key]: label }));

  const tags = Object.values(selected).filter(Boolean);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: userData }, { data: rows, error: fetchError }] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("comments")
        .select("id, user_id, user_name, content, tags, is_anonymous, edited_at, created_at")
        .eq("place_id", placeId)
        .order("created_at", { ascending: false }),
    ]);
    const uid = userData.user?.id ?? null;
    setUserId(uid);
    if (!fetchError) setComments(rows || []);
    setReady(true);

    const ids = (rows || []).map((r) => r.id);
    if (ids.length) {
      const { data: likes } = await supabase
        .from("comment_likes")
        .select("comment_id, user_id")
        .in("comment_id", ids);
      const counts = {};
      const mine = [];
      for (const l of likes || []) {
        counts[l.comment_id] = (counts[l.comment_id] || 0) + 1;
        if (l.user_id === uid) mine.push(l.comment_id);
      }
      setLikeCounts(counts);
      setLikedByMe(mine);
    }
  }, [placeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      show(t.authPrompt.comment);
      return;
    }

    setPending(true);
    setError(null);
    const userName =
      user.user_metadata?.full_name || user.email?.split("@")[0] || t.comments.defaultUserName;
    const { data: inserted, error: insertError } = await supabase
      .from("comments")
      .insert({
        place_id: placeId,
        user_id: user.id,
        user_name: userName,
        content: trimmed,
        tags,
        is_anonymous: anonymous,
      })
      .select("id, user_id, user_name, content, tags, is_anonymous, edited_at, created_at")
      .single();

    if (insertError) {
      console.error("[comments] insert fallito:", insertError.message);
      setError(t.comments.postError);
    } else {
      setComments((prev) => [inserted, ...prev]);
      setContent("");
      setSelected({});
      setAnonymous(false);
    }
    setPending(false);
  }

  async function handleDelete(id) {
    const supabase = createClient();
    const prev = comments;
    setComments((c) => c.filter((x) => x.id !== id)); // ottimistico
    const { error: deleteError } = await supabase.from("comments").delete().eq("id", id);
    if (deleteError) setComments(prev); // ripristina in caso di errore
  }

  async function handleReport(id) {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      show(t.authPrompt.report);
      return;
    }
    setReported((r) => [...r, id]);
    await supabase.rpc("report_comment", { p_comment_id: id });
  }

  async function toggleLike(id) {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      show(t.authPrompt.like);
      return;
    }

    const alreadyLiked = likedByMe.includes(id);
    // Ottimistico: aggiorna subito, ripristina se la chiamata fallisce.
    setLikedByMe((l) => (alreadyLiked ? l.filter((x) => x !== id) : [...l, id]));
    setLikeCounts((c) => ({ ...c, [id]: (c[id] || 0) + (alreadyLiked ? -1 : 1) }));

    const { error: likeError } = alreadyLiked
      ? await supabase.from("comment_likes").delete().eq("comment_id", id).eq("user_id", user.id)
      : await supabase.from("comment_likes").insert({ comment_id: id, user_id: user.id });

    if (likeError) {
      setLikedByMe((l) => (alreadyLiked ? [...l, id] : l.filter((x) => x !== id)));
      setLikeCounts((c) => ({ ...c, [id]: (c[id] || 0) + (alreadyLiked ? 1 : -1) }));
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setEditContent(c.content);
    const sel = {};
    for (const cat of categories) {
      const found = (c.tags || []).find((t) => cat.options.includes(t));
      if (found) sel[cat.key] = found;
    }
    setEditSelected(sel);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id) {
    const trimmed = editContent.trim();
    if (!trimmed) return;

    setEditPending(true);
    const supabase = createClient();
    const editTags = Object.values(editSelected).filter(Boolean);
    const { data: updated, error: updateError } = await supabase
      .from("comments")
      .update({ content: trimmed, tags: editTags, edited_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, user_id, user_name, content, tags, is_anonymous, edited_at, created_at")
      .single();

    if (!updateError) {
      setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
    }
    setEditPending(false);
  }

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-sam-green">{t.comments.title}</h2>

      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={t.comments.placeholder}
          className={`${inputClass} resize-none`}
        />

        {/* Feedback rapido, opzionale: una scelta pro/neutro/contro per categoria. */}
        <CategoryPicker categories={categories} selected={selected} onSelect={selectOption} t={t} />

        {error && <p className="text-sm text-sam-coral">{error}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-sam-brown">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-sam-cream text-sam-green focus:ring-sam-green"
            />
            {t.comments.anonymous}
          </label>
          <button type="submit" disabled={pending || !content.trim()} className="btn-primary disabled:opacity-60">
            {pending ? t.comments.publishing : t.comments.publish}
          </button>
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {!ready && <p className="text-sm text-sam-muted">{t.comments.loading}</p>}
        {ready && comments.length === 0 && (
          <p className="text-sm text-sam-muted">{t.comments.empty}</p>
        )}
        {comments.map((c) =>
          editingId === c.id ? (
            <div key={c.id} className="rounded-2xl border border-sam-green bg-white p-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={500}
                rows={3}
                className={`${inputClass} resize-none`}
              />
              <div className="mt-2">
                <CategoryPicker categories={categories} selected={editSelected} onSelect={selectEditOption} t={t} />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={cancelEdit} className="btn-outline px-4 py-1.5 text-xs">
                  {t.comments.cancel}
                </button>
                <button
                  type="button"
                  disabled={editPending || !editContent.trim()}
                  onClick={() => saveEdit(c.id)}
                  className="btn-primary px-4 py-1.5 text-xs disabled:opacity-60"
                >
                  {editPending ? t.comments.saving : t.comments.save}
                </button>
              </div>
            </div>
          ) : (
            <div key={c.id} className="rounded-2xl border border-sam-cream bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-sam-green">
                  {c.is_anonymous ? t.comments.anonName : c.user_name}
                </span>
                <span className="text-xs text-sam-muted">
                  {new Date(c.created_at).toLocaleDateString(t.dateLocale, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {c.edited_at && t.comments.editedSuffix}
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
              <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => toggleLike(c.id)}
                  aria-pressed={likedByMe.includes(c.id)}
                  className={`flex items-center gap-1 font-semibold ${
                    likedByMe.includes(c.id) ? "text-sam-coral" : "text-sam-muted hover:text-sam-coral"
                  }`}
                >
                  {likedByMe.includes(c.id) ? "❤️" : "🤍"} {likeCounts[c.id] || 0}
                </button>
                {c.user_id === userId ? (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="font-semibold text-sam-green hover:underline"
                    >
                      {t.comments.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="font-semibold text-sam-coral hover:underline"
                    >
                      {t.comments.delete}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={reported.includes(c.id)}
                    onClick={() => handleReport(c.id)}
                    className="font-semibold text-sam-muted hover:underline disabled:no-underline disabled:opacity-60"
                  >
                    {reported.includes(c.id) ? t.comments.reported : t.comments.report}
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
