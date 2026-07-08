import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export const metadata = { title: "Il tuo account — SAM" };

// Pagina protetta: renderizzata dinamicamente (legge la sessione).
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = user.user_metadata?.full_name || user.email?.split("@")[0];

  return (
    <div className="container-sam py-12">
      <h1 className="font-display text-3xl font-bold text-sam-green">Ciao, {name}</h1>
      <p className="mt-1 text-sm text-sam-muted">Gestisci il tuo account SAM.</p>

      <div className="mt-6 max-w-md rounded-2xl border border-sam-cream bg-white p-5 shadow-card">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-semibold text-sam-green">Email</dt>
            <dd className="text-sam-brown/90">{user.email}</dd>
          </div>
          {user.user_metadata?.full_name && (
            <div>
              <dt className="font-semibold text-sam-green">Nome</dt>
              <dd className="text-sam-brown/90">{user.user_metadata.full_name}</dd>
            </div>
          )}
        </dl>

        <div className="mt-5 flex flex-col gap-2">
          <Link href="/favorites" className="btn-outline w-full">
            ♥ I miei preferiti
          </Link>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
