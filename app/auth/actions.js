"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PRIVACY_VERSION } from "@/lib/profile";

// Le action con useFormState ricevono (statoPrecedente, formData).
//
// Queste action girano lato server, fuori dal contesto di lingua della pagina:
// non restituiscono testo ma un CODICE (`errorCode` / `messageCode`), che il
// componente client traduce con authMessage() nella lingua corrente.

export async function login(_prev, formData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { errorCode: "missingCredentials" };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { errorCode: codiceErrore(error.message) };

  revalidatePath("/", "layout");
  redirect("/account");
}

export async function signup(_prev, formData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const firstName = String(formData.get("first_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  if (!email || !password) return { errorCode: "missingCredentials" };
  if (password.length < 6) return { errorCode: "passwordTooShort" };

  // Consenso obbligatorio all'informativa privacy: senza, niente registrazione.
  const acceptPrivacy = formData.get("accept_privacy") === "on";
  if (!acceptPrivacy) {
    return { errorCode: "mustAcceptPrivacy" };
  }

  // Consenso SEPARATO e facoltativo alle analytics/profilazione. I dati di
  // profilazione vengono raccolti SOLO se questo consenso è stato dato.
  const consentAnalytics = formData.get("consent_analytics") === "on";
  const occupation = consentAnalytics ? String(formData.get("occupation") || "").trim() : "";
  // L'università ha senso solo per gli studenti.
  const university =
    consentAnalytics && occupation === "studente"
      ? String(formData.get("university") || "").trim()
      : "";
  const ageRange = consentAnalytics ? String(formData.get("age_range") || "").trim() : "";

  const origin = headers().get("origin");
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        occupation,
        university,
        age_range: ageRange,
        // Tracciamento del consenso (a quale versione e per quali finalità).
        consent_privacy_version: PRIVACY_VERSION,
        consent_analytics: consentAnalytics,
      },
      emailRedirectTo: `${origin}/auth/confirm?next=/account`,
    },
  });
  if (error) return { errorCode: codiceErrore(error.message) };

  return { messageCode: "confirmSent" };
}

export async function magicLink(_prev, formData) {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { errorCode: "missingEmail" };

  const origin = headers().get("origin");
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=/account` },
  });
  if (error) return { errorCode: codiceErrore(error.message) };

  return { messageCode: "magicSent" };
}

export async function signout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

// Cancellazione definitiva dell'account (diritto all'oblio, art. 17 GDPR).
// Elimina l'utente da auth.users tramite la funzione `delete_current_user`
// (che agisce solo sul richiedente); il cascade rimuove profilo e preferiti.
export async function deleteAccount() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("delete_current_user");
  if (error) {
    return { errorCode: "deleteFailed" };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/?deleted=1");
}

// I messaggi Supabase arrivano in inglese tecnico: li riconosciamo e li
// riduciamo a un codice, che il client traduce nella lingua della pagina.
function codiceErrore(msg = "") {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "invalidCredentials";
  if (m.includes("email not confirmed")) return "emailNotConfirmed";
  if (m.includes("already registered")) return "alreadyRegistered";
  if (m.includes("rate limit") || m.includes("too many")) return "rateLimit";
  return "generic";
}
