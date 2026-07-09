import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import ProfileForm from "@/components/ProfileForm";

export const metadata = { title: "Il tuo account — SAM" };

// Pagina protetta: renderizzata dinamicamente (legge la sessione).
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const m = user.user_metadata || {};
  const name = m.full_name || user.email?.split("@")[0];

  return (
    <div className="container-sam py-12">
      <h1 className="font-display text-3xl font-bold text-sam-green">Ciao, {name}</h1>
      <p className="mt-1 text-sm text-sam-muted">Visualizza e modifica i tuoi dati.</p>

      <ProfileForm
        userId={user.id}
        email={user.email}
        initial={{
          first_name: m.first_name || "",
          last_name: m.last_name || "",
          occupation: m.occupation || "",
          university: m.university || "",
          age_range: m.age_range || "",
        }}
      />

      <div className="mt-4 flex max-w-md flex-col gap-2">
        <Link href="/favorites" className="btn-outline w-full">
          ♥ I miei preferiti
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}
