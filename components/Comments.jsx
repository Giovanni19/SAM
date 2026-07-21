"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthPrompt } from "@/components/AuthPrompt";

const inputClass =
  "w-full rounded-xl border border-sam-cream bg-sam-paper px-4 py-2.5 text-sm outline-none focus:border-sam-green";

// Feedback libero di chi ha usato il posto — non è lo stesso "verificato"
// dei filtri (quello descrive lo spazio, questo l'esperienza di chi ci va).
// Una sola scelta per categoria (pro/neutro/contro): evita combinazioni
// contraddittorie tipo "WiFi veloce" + "WiFi lento" sullo stesso commento.
const FEEDBACK_CATEGORIES = [
  { key: "pulizia", label: "Pulizia", options: ["🧼 Ambiente pulito", "😐 Ambiente nella media", "🧹 Poco pulito"] },
  { key: "bagno", label: "Bagno", options: ["🚻 Bagno pulito", "😐 Bagno nella media", "🚽 Bagno sporco"] },
  { key: "wifi", label: "WiFi", options: ["📶 WiFi veloce", "😐 WiFi nella media", "📵 WiFi lento o assente"] },
  { key: "prese", label: "Prese", options: ["🔌 Tante prese", "😐 Prese sufficienti", "🪫 Poche prese"] },
  { key: "rumore", label: "Rumore", options: ["🤫 Tranquillo per concentrarsi", "😐 Rumore nella media", "🔊 Troppo rumoroso"] },
  { key: "posti", label: "Posti a sedere", options: ["🪑 Posti comodi", "😐 Posti nella media", "🥴 Posti scomodi"] },
  { key: "personale", label: "Personale", options: ["😊 Personale gentile", "😐 Personale nella media", "😒 Personale scortese"] },
  { key: "prezzi", label: "Prezzi", options: ["💰 Prezzi onesti", "😐 Prezzi nella media", "💸 Prezzi alti"] },
  { key: "accessibilita", label: "Accessibilità", options: ["♿ Accessibile in carrozzina", "😐 Accessibilità nella media", "🚫 Non accessibile"] },
];
// Stile del chip in base alla posizione nella terna (0=pro, 1=neutro, 2=contro).
const TONE_CLASS = [
  "bg-sam-green text-sam-paper",
  "bg-sam-muted text-sam-paper",
  "bg-sam-coral text-sam-paper",
];

// Commenti pubblici per spazio. Chiunque li legge; solo chi è loggato può
// scriverne o segnalarne uno altrui. Moderazione minima: dopo 3 segnalazioni
// distinte un commento si nasconde da solo (vedi report_comment() in
// supabase/schema.sql) — niente pannello admin per ora.
export default function Comments({ placeId }) {
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
  const { show } = useAuthPrompt();

  const selectOption = (key, label) =>
    setSelected((s) => (s[key] === label ? { ...s, [key]: undefined } : { ...s, [key]: label }));

  const tags = Object.values(selected).filter(Boolean);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: userData }, { data: rows, error: fetchError }] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("comments")
        .select("id, user_id, user_name, content, tags, is_anonymous, created_at")
        .eq("place_id", placeId)
        .order("created_at", { ascending: false }),
    ]);
    setUserId(userData.user?.id ?? null);
    if (!fetchError) setComments(rows || []);
    setReady(true);
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
      show("Accedi o registrati per lasciare un commento");
      return;
    }

    setPending(true);
    setError(null);
    const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Utente SAM";
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
      .select("id, user_id, user_name, content, tags, is_anonymous, created_at")
      .single();

    if (insertError) {
      setError("Non è stato possibile pubblicare il commento. Riprova.");
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
      show("Accedi per segnalare un commento");
      return;
    }
    setReported((r) => [...r, id]);
    await supabase.rpc("report_comment", { p_comment_id: id });
  }

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-sam-green">Commenti</h2>

      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Com'è andata la tua sessione di studio qui?"
          className={`${inputClass} resize-none`}
        />

        {/* Feedback rapido, opzionale: una scelta pro/neutro/contro per categoria. */}
        <div className="space-y-1.5">
          {FEEDBACK_CATEGORIES.map(({ key, label, options }) => (
            <div key={key} className="flex flex-wrap items-center gap-1.5">
              <span className="w-28 shrink-0 text-xs font-semibold text-sam-green">{label}</span>
              {options.map((opt, i) => {
                const active = selected[key] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectOption(key, opt)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      active ? TONE_CLASS[i] : "bg-sam-cream text-sam-brown hover:bg-sam-cream/70"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-sam-coral">{error}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-sam-brown">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-sam-cream text-sam-green focus:ring-sam-green"
            />
            Commenta in modo anonimo
          </label>
          <button type="submit" disabled={pending || !content.trim()} className="btn-primary disabled:opacity-60">
            {pending ? "Pubblicazione…" : "Pubblica commento"}
          </button>
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {!ready && <p className="text-sm text-sam-muted">Caricamento commenti…</p>}
        {ready && comments.length === 0 && (
          <p className="text-sm text-sam-muted">Ancora nessun commento: scrivi il primo.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="rounded-2xl border border-sam-cream bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-sam-green">
                {c.is_anonymous ? "🕶️ Anonimo" : c.user_name}
              </span>
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
            <div className="mt-2 flex justify-end gap-3 text-xs">
              {c.user_id === userId ? (
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="font-semibold text-sam-coral hover:underline"
                >
                  Elimina
                </button>
              ) : (
                <button
                  type="button"
                  disabled={reported.includes(c.id)}
                  onClick={() => handleReport(c.id)}
                  className="font-semibold text-sam-muted hover:underline disabled:no-underline disabled:opacity-60"
                >
                  {reported.includes(c.id) ? "Segnalato" : "Segnala"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
