"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { OCCUPATIONS, MILAN_UNIVERSITIES, AGE_RANGES } from "@/lib/profile";

const inputClass =
  "w-full rounded-xl border border-sam-cream bg-sam-paper px-4 py-2.5 text-sm outline-none focus:border-sam-green";

// Form dei dati account: mostra i valori attuali e permette di modificarli.
// Salva sia nei metadata utente (usati dall'app) sia nella tabella profiles
// (usata per le analytics), così restano allineati.
export default function ProfileForm({ userId, email, initial, consentAnalytics = false }) {
  const [firstName, setFirstName] = useState(initial.first_name || "");
  const [lastName, setLastName] = useState(initial.last_name || "");
  const [occupation, setOccupation] = useState(initial.occupation || "");
  const [university, setUniversity] = useState(initial.university || "");
  const [ageRange, setAgeRange] = useState(initial.age_range || "");

  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setPending(true);

    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    // I dati di profilazione si salvano SOLO se è attivo il relativo consenso;
    // altrimenti restano vuoti (rispetto del consenso). L'università ha senso
    // solo per gli studenti.
    const occ = consentAnalytics ? occupation : "";
    const uni = consentAnalytics && occupation === "studente" ? university : "";
    const age = consentAnalytics ? ageRange : "";
    const data = {
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      occupation: occ,
      university: uni,
      age_range: age,
    };

    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ data });
    if (authError) {
      setError("Non è stato possibile salvare. Riprova.");
      setPending(false);
      return;
    }
    // Allinea anche la tabella profiles (per le analytics). Se fallisce non è
    // bloccante: i metadata sono comunque aggiornati.
    await supabase
      .from("profiles")
      .update({ full_name: fullName, first_name: firstName, last_name: lastName, occupation: occ || null, university: uni || null, age_range: age || null })
      .eq("id", userId);

    setMessage("Dati salvati.");
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-3 rounded-2xl border border-sam-cream bg-white p-5 shadow-card">
      {/* Email: sola lettura (per cambiarla serve una verifica a parte) */}
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-sam-green">Email</span>
        <input value={email} disabled className={`${inputClass} opacity-60`} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-sam-green">Nome</span>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-sam-green">Cognome</span>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
        </label>
      </div>

      {/* Dati di profilazione: modificabili solo se il consenso è attivo.
          La gestione del consenso è nella sezione "Privacy e dati" più sotto. */}
      {consentAnalytics ? (
        <>
          {/* Occupazione */}
          <div>
            <span className="mb-1 block text-xs font-semibold text-sam-green">Cosa fai?</span>
            <div className="flex flex-wrap gap-2">
              {OCCUPATIONS.map((o) => {
                const active = occupation === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setOccupation(active ? "" : o.value)}
                    aria-pressed={active}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active ? "bg-sam-green text-sam-paper" : "bg-sam-cream text-sam-brown hover:bg-sam-cream/70"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Università: solo se studente */}
          {occupation === "studente" && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-sam-green">Università</span>
              <select value={university} onChange={(e) => setUniversity(e.target.value)} className={inputClass}>
                <option value="">Seleziona…</option>
                {MILAN_UNIVERSITIES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </label>
          )}

          {/* Fascia d'età */}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-sam-green">Età</span>
            <select value={ageRange} onChange={(e) => setAgeRange(e.target.value)} className={inputClass}>
              <option value="">Preferisco non dirlo</option>
              {AGE_RANGES.map((a) => (
                <option key={a} value={a}>{a} anni</option>
              ))}
            </select>
          </label>
        </>
      ) : (
        <p className="rounded-xl bg-sam-cream/50 px-3 py-2 text-[11px] text-sam-muted">
          I campi occupazione, università ed età sono disattivati: puoi abilitarli dando il consenso
          alle analytics nella sezione “Privacy e dati” qui sotto.
        </p>
      )}

      {error && <p className="text-sm text-sam-coral">{error}</p>}
      {message && <p className="text-sm text-sam-green">{message}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
        {pending ? "Salvataggio…" : "Salva modifiche"}
      </button>
    </form>
  );
}
