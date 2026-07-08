"use client";

import { createClient } from "@/lib/supabase/client";

// Logout lato CLIENT: azzera la sessione nel browser (cookie condivisi col
// server) e ricarica la home. Così l'avatar e i preferiti rileggono da zero
// lo stato "non loggato", senza rimanere "appesi" alla vecchia sessione.
export default function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  return (
    <button type="button" onClick={handleLogout} className="btn-primary w-full">
      Esci
    </button>
  );
}
