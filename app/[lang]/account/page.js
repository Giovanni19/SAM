import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import ProfileForm from "@/components/ProfileForm";
import AccountPrivacy from "@/components/AccountPrivacy";
import { getDictionary, localeHref } from "@/lib/i18n";

export function generateMetadata({ params }) {
  return { title: getDictionary(params.lang).account.metaTitle };
}

// Pagina protetta: renderizzata dinamicamente (legge la sessione).
export const dynamic = "force-dynamic";

export default async function AccountPage({ params }) {
  const { lang } = params;
  const t = getDictionary(lang);
  const href = (path) => localeHref(lang, path);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(href("/login"));

  const m = user.user_metadata || {};
  const name = m.full_name || user.email?.split("@")[0];

  // Stato del consenso alle analytics: fonte autorevole = tabella profiles.
  const { data: profile } = await supabase
    .from("profiles")
    .select("consent_analytics")
    .eq("id", user.id)
    .maybeSingle();
  const consentAnalytics = Boolean(profile?.consent_analytics);

  return (
    <div className="container-sam py-12">
      <h1 className="font-display text-3xl font-bold text-sam-green">{t.account.greeting(name)}</h1>
      <p className="mt-1 text-sm text-sam-muted">{t.account.subtitle}</p>

      <ProfileForm
        userId={user.id}
        email={user.email}
        consentAnalytics={consentAnalytics}
        initial={{
          first_name: m.first_name || "",
          last_name: m.last_name || "",
          occupation: m.occupation || "",
          university: m.university || "",
          age_range: m.age_range || "",
        }}
      />

      <div className="mt-4 flex max-w-md flex-col gap-2">
        <Link href={href("/favorites")} className="btn-outline w-full">
          {t.account.myFavorites}
        </Link>
        <Link href={href("/comments")} className="btn-outline w-full">
          {t.account.myComments}
        </Link>
        <LogoutButton />
      </div>

      {/* Privacy & controllo dati: consenso, export, cancellazione */}
      <AccountPrivacy userId={user.id} consentAnalytics={consentAnalytics} />
    </div>
  );
}
