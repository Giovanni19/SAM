"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { amenityFilters, typeMeta } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";
import { useFavorites } from "@/lib/useFavorites";
import { useAuthPrompt } from "@/components/AuthPrompt";

const MAPS_URL = /^https:\/\/((www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl\/|goo\.gl\/maps\/)/i;
const TYPES = ["Caffetteria", "Biblioteca", "Libreria", "Altro"];
// Colonne della tabella place_suggestions per ogni filtro amenità.
const COLUMN = { stayPolicy: "stay_policy" };

const EMPTY = { maps_url: "", name: "", type: "", note: "" };

export default function SuggestForm() {
  const { t, href } = useI18n();
  const { isLoggedIn } = useFavorites();
  const { show } = useAuthPrompt();
  const amenities = amenityFilters(t);

  const [form, setForm] = useState(EMPTY);
  const [details, setDetails] = useState({});
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const url = form.maps_url.trim();
    if (!MAPS_URL.test(url)) {
      setError(t.suggest.mapsInvalid);
      return;
    }

    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      show(t.suggest.loginNeeded);
      return;
    }

    setStatus("sending");
    setError(null);
    const row = {
      user_id: user.id,
      user_email: user.email ?? null,
      maps_url: url,
      name: form.name.trim(),
      type: form.type || null,
      note: form.note.trim() || null,
    };
    for (const { key } of amenities) row[COLUMN[key] ?? key] = details[key] || null;

    const { error: insertError } = await supabase.from("place_suggestions").insert(row);
    if (insertError) {
      console.error("[suggest] insert fallito:", insertError.message);
      setError(t.suggest.error);
      setStatus("idle");
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-sam-cream bg-white p-6 text-center">
        <p className="font-display text-xl font-bold text-sam-green">{t.suggest.thanksTitle}</p>
        <p className="mt-2 text-sm text-sam-brown/90">{t.suggest.thanks}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              setForm(EMPTY);
              setDetails({});
              setStatus("idle");
            }}
          >
            {t.suggest.another}
          </button>
          <Link href={href("/")} className="btn-primary">
            {t.nav.map}
          </Link>
        </div>
      </div>
    );
  }

  const input =
    "mt-1 w-full rounded-xl border border-sam-cream bg-white px-3 py-2.5 text-sm text-sam-brown focus:border-sam-green focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-sam-cream bg-white p-5 sm:p-6">
      <label className="block">
        <span className="text-sm font-semibold text-sam-green">{t.suggest.mapsLabel} *</span>
        <input
          type="url"
          required
          inputMode="url"
          value={form.maps_url}
          onChange={set("maps_url")}
          placeholder="https://maps.app.goo.gl/…"
          className={input}
        />
        <span className="mt-1 block text-xs text-sam-muted">{t.suggest.mapsHint}</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-sam-green">{t.suggest.nameLabel} *</span>
          <input type="text" required maxLength={120} value={form.name} onChange={set("name")} className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-sam-green">{t.suggest.typeLabel}</span>
          <select value={form.type} onChange={set("type")} className={input}>
            <option value="">{t.suggest.dontKnow}</option>
            {TYPES.map((type) => {
              const meta = typeMeta(type, t);
              return (
                <option key={type} value={type}>
                  {meta.emoji} {meta.label}
                </option>
              );
            })}
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="font-display text-base font-bold text-sam-green">{t.suggest.detailsTitle}</legend>
        <p className="mt-0.5 text-xs text-sam-muted">{t.suggest.detailsHint}</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {amenities.map(({ key, label, options }) => (
            <label key={key} className="block">
              <span className="text-sm font-semibold text-sam-green">{label}</span>
              <select
                value={details[key] || ""}
                onChange={(e) => setDetails((d) => ({ ...d, [key]: e.target.value }))}
                className={input}
              >
                <option value="">{t.suggest.dontKnow}</option>
                {options
                  .filter(([value]) => value !== "non verificato")
                  .map(([value, optionLabel]) => (
                    <option key={value} value={value}>
                      {optionLabel}
                    </option>
                  ))}
              </select>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="text-sm font-semibold text-sam-green">{t.suggest.noteLabel}</span>
        <textarea
          rows={3}
          maxLength={500}
          value={form.note}
          onChange={set("note")}
          placeholder={t.suggest.notePlaceholder}
          className={input}
        />
      </label>

      {error && <p className="text-sm font-semibold text-sam-coral">{error}</p>}

      <button type="submit" disabled={status === "sending"} className="btn-primary w-full sm:w-auto">
        {status === "sending" ? t.suggest.sending : t.suggest.submit}
      </button>
      {!isLoggedIn && <p className="text-xs text-sam-muted">🔒 {t.suggest.loginNeeded}</p>}
    </form>
  );
}
