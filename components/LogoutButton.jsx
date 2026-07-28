"use client";

import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/I18nProvider";

// Logout lato CLIENT: azzera la sessione nel browser (cookie condivisi col
// server) e ricarica la home. Così l'avatar e i preferiti rileggono da zero
// lo stato "non loggato", senza rimanere "appesi" alla vecchia sessione.
export default function LogoutButton() {
  const { t, href } = useI18n();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign(href("/"));
  }

  return (
    <button type="button" onClick={handleLogout} className="btn-primary w-full">
      {t.nav.logout}
    </button>
  );
}
